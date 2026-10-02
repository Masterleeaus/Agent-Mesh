#!/usr/bin/env python3
"""Collect read-only, credential-free observations for the #812 host gate.

This tool never enables the RAW relay, follows redirects, sends cookies, or
prints response bodies, Set-Cookie values, or process command lines. Its report
is evidence for an owner review; a clean report is not commissioning approval.
"""

import argparse
import hashlib
import http.client
import ipaddress
import json
import re
import socket
import ssl
import subprocess
import sys
from urllib.parse import urljoin, urlsplit


CANDIDATE_HOST = "server-216-219-85-159.da.direct"
PANEL_PORTS = (443, 2222)
RELAY_PORTS = (3010, 3015)
LOCAL_PORTS = (80, 443, 2222, 3010, 3015)
MAX_RESPONSE_SAMPLE = 64 * 1024
PRIVATE_NETWORKS = tuple(
    ipaddress.ip_network(value)
    for value in ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "fc00::/7", "127.0.0.0/8", "::1/128")
)


def resolve_addresses(host, port=0):
    try:
        literal = ipaddress.ip_address(host)
        return [str(literal)]
    except ValueError:
        pass
    rows = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    return sorted({row[4][0].split("%", 1)[0] for row in rows})


def _error_code(error):
    if isinstance(error, ssl.SSLCertVerificationError):
        return "tls-verification-failed"
    if isinstance(error, socket.gaierror):
        return "dns-unavailable"
    if isinstance(error, (socket.timeout, TimeoutError)):
        return "timeout"
    if isinstance(error, ConnectionRefusedError):
        return "refused"
    return "unavailable"


def _certificate_summary(certificate):
    def first_value(section, label):
        for group in certificate.get(section, ()):
            for key, value in group:
                if key == label:
                    return value[:160]
        return None

    names = [value[:160] for kind, value in certificate.get("subjectAltName", ()) if kind == "DNS"][:12]
    return {
        "subject_cn": first_value("subject", "commonName"),
        "issuer_cn": first_value("issuer", "commonName"),
        "issuer_org": first_value("issuer", "organizationName"),
        "not_before": certificate.get("notBefore"),
        "not_after": certificate.get("notAfter"),
        "dns_sans": names,
    }


def _location_summary(host, port, location):
    if not location:
        return None
    try:
        resolved = urlsplit(urljoin(f"https://{host}:{port}/", location))
        same_origin = resolved.scheme == "https" and resolved.hostname == host and resolved.port == port
        return {"same_origin": same_origin}
    except (TypeError, ValueError):
        return {"same_origin": False}


def probe_https(host, port, timeout=5, context=None, connect_address=None):
    """GET only `/` over a pinned direct TLS socket; no credentials or redirects."""
    raw = None
    tls = None
    try:
        raw = socket.create_connection((connect_address or host, port), timeout=timeout)
        tls = (context or ssl.create_default_context()).wrap_socket(raw, server_hostname=host)
        request_host = f"[{host}]" if ":" in host else host
        tls.sendall((
            f"GET / HTTP/1.1\r\n"
            f"Host: {request_host}:{port}\r\n"
            "User-Agent: Titan-DirectAdmin-ReadOnly-Commissioning/1.0\r\n"
            "Connection: close\r\n\r\n"
        ).encode("ascii"))
        response = http.client.HTTPResponse(tls)
        response.begin()
        certificate = tls.getpeercert()
        body = response.read(MAX_RESPONSE_SAMPLE + 1)
        sample = body[:MAX_RESPONSE_SAMPLE]
        title_match = re.search(rb"<title\b[^>]*>(.*?)</title\s*>", sample, re.I | re.S)
        title_hash = hashlib.sha256(title_match.group(1)).hexdigest() if title_match else None
        cookie_names = []
        for value in response.headers.get_all("Set-Cookie", []):
            name = value.partition(";")[0].partition("=")[0].strip()
            if name and re.fullmatch(r"[!#$%&'*+.^_`|~0-9A-Za-z-]{1,128}", name):
                cookie_names.append(name)
        return {
            "state": "observed",
            "status": response.status,
            "content_type": (response.getheader("Content-Type") or "")[:160],
            "redirect": _location_summary(host, port, response.getheader("Location")),
            "set_cookie_names": sorted(set(cookie_names)),
            "sample_bytes": len(sample),
            "sample_truncated": len(body) > MAX_RESPONSE_SAMPLE,
            "sample_sha256": hashlib.sha256(sample).hexdigest(),
            "html_title_sha256": title_hash,
            "tls": _certificate_summary(certificate),
        }
    except (OSError, ssl.SSLError, http.client.HTTPException) as error:
        return {"state": _error_code(error)}
    finally:
        if tls is not None:
            tls.close()
        elif raw is not None:
            raw.close()


def probe_tcp(host, port, timeout=3, connect_address=None):
    try:
        with socket.create_connection((connect_address or host, port), timeout=timeout):
            return {"state": "reachable"}
    except OSError as error:
        return {"state": _error_code(error)}


def _private_address(address):
    try:
        value = ipaddress.ip_address(address.split("%", 1)[0])
    except ValueError:
        return False
    return any(value in network for network in PRIVATE_NETWORKS)


def _public_address(address):
    try:
        value = ipaddress.ip_address(address.split("%", 1)[0])
    except (AttributeError, ValueError):
        return False
    return value.is_global and not value.is_reserved and not (
        value.version == 6 and value.ipv4_mapped is not None
    )


def _address_probe_rows(addresses, ports, probe, host, timeout):
    return {
        str(port): [
            {"address": address, **probe(host, port, timeout=timeout, connect_address=address)}
            for address in addresses
        ]
        for port in ports
    }


def parse_private_origin(value, resolver=resolve_addresses):
    """Validate a fixed private Workforce origin without sending any request."""
    try:
        parsed = urlsplit(value)
        port = parsed.port if parsed.port is not None else (443 if parsed.scheme == "https" else 80)
    except (TypeError, ValueError):
        raise ValueError("private-origin-invalid")
    if (
        parsed.scheme not in ("http", "https")
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.path not in ("", "/")
        or parsed.query
        or parsed.fragment
        or not 1 <= port <= 65535
    ):
        raise ValueError("private-origin-invalid")
    if parsed.scheme == "http":
        try:
            literal = ipaddress.ip_address(parsed.hostname)
        except ValueError:
            raise ValueError("plain-http-requires-literal-loopback")
        if not literal.is_loopback:
            raise ValueError("plain-http-requires-literal-loopback")
        return {"scheme": "http", "host": parsed.hostname, "port": port, "addresses": [str(literal)]}
    try:
        addresses = resolver(parsed.hostname, port)
    except OSError:
        raise ValueError("private-origin-dns-unavailable")
    if not addresses or not all(_private_address(address) for address in addresses):
        raise ValueError("private-origin-must-resolve-only-to-private-addresses")
    return {"scheme": "https", "host": parsed.hostname, "port": port, "addresses": sorted(set(addresses))}


def probe_private_origin(value, timeout=5, resolver=resolve_addresses):
    """Check direct TCP or verified TLS to an operator-supplied fixed private origin."""
    try:
        origin = parse_private_origin(value, resolver)
    except ValueError as error:
        return {"state": str(error)}
    try:
        # Connect to an address already checked above; TLS still validates the
        # operator-supplied hostname, and a second DNS lookup cannot escape the
        # private-address check.
        raw = socket.create_connection((origin["addresses"][0], origin["port"]), timeout=timeout)
        if origin["scheme"] == "https":
            with ssl.create_default_context().wrap_socket(raw, server_hostname=origin["host"]):
                pass
        else:
            raw.close()
        return {"state": "reachable", "scheme": origin["scheme"], "port": origin["port"], "addresses": origin["addresses"]}
    except (OSError, ssl.SSLError) as error:
        return {"state": _error_code(error), "scheme": origin["scheme"], "port": origin["port"], "addresses": origin["addresses"]}


def parse_listener_output(output):
    listeners = []
    for line in output.splitlines():
        fields = line.split()
        if len(fields) < 4:
            continue
        local = fields[3]
        try:
            port = int(local.rsplit(":", 1)[1])
        except (IndexError, ValueError):
            continue
        if port in LOCAL_PORTS:
            address = local.rsplit(":", 1)[0]
            listeners.append({"port": port, "address": address})
    return sorted(listeners, key=lambda row: (row["port"], row["address"]))


def _port_in_rule_list(value, port):
    for raw_token in value.split(","):
        token = raw_token.strip()
        if not token:
            continue
        pieces = token.split(":")
        try:
            if len(pieces) == 1 and int(pieces[0]) == port:
                return True
            if len(pieces) == 2 and int(pieces[0]) <= port <= int(pieces[1]):
                return True
        except ValueError:
            continue
    return False


def read_csf_inbound_config(path="/etc/csf/csf.conf"):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as stream:
            content = stream.read()
    except OSError:
        return {str(port): "unknown" for port in RELAY_PORTS}
    rows = dict(re.findall(r'^\s*(TCP6?_IN)\s*=\s*"([^"]*)"', content, re.M))
    result = {}
    for port in RELAY_PORTS:
        if any(name in rows and _port_in_rule_list(rows[name], port) for name in ("TCP_IN", "TCP6_IN")):
            result[str(port)] = "listed"
        elif any(name not in rows for name in ("TCP_IN", "TCP6_IN")):
            result[str(port)] = "unknown"
        else:
            result[str(port)] = "not-listed"
    return result


def run_external(timeout=5):
    try:
        addresses = resolve_addresses(CANDIDATE_HOST, 443)
        dns = {"state": "resolved", "addresses": addresses}
    except OSError as error:
        addresses = []
        dns = {"state": _error_code(error), "addresses": []}
    if addresses and not all(_public_address(address) for address in addresses):
        dns = {"state": "rejected-non-global-answer", "answer_count": len(addresses)}
        web = {str(port): [] for port in PANEL_PORTS}
        reachability = {str(port): [] for port in RELAY_PORTS}
        result = "blocker"
    elif addresses:
        web = _address_probe_rows(addresses, PANEL_PORTS, probe_https, CANDIDATE_HOST, timeout)
        reachability = _address_probe_rows(addresses, RELAY_PORTS, probe_tcp, CANDIDATE_HOST, 3)
        tls_bad = any(
            item.get("state") == "tls-verification-failed"
            or (item.get("redirect") and not item["redirect"]["same_origin"])
            for rows in web.values() for item in rows
        )
        exposed = any(item.get("state") == "reachable" for rows in reachability.values() for item in rows)
        unknown = any(
            item.get("state") != "observed" or not 200 <= item.get("status", 0) < 400
            for rows in web.values() for item in rows
        ) or any(
            item.get("state") != "refused" for rows in reachability.values() for item in rows
        )
        result = "blocker" if tls_bad or exposed else "incomplete" if unknown else "evidence-only"
    else:
        web = {str(port): [] for port in PANEL_PORTS}
        reachability = {str(port): [] for port in RELAY_PORTS}
        result = "incomplete"
    return {
        "mode": "external",
        "candidate_host": CANDIDATE_HOST,
        "expected_panel_origin": f"https://{CANDIDATE_HOST}:2222",
        "expected_directadmin_provider": f"directadmin:https://{CANDIDATE_HOST}:2222",
        "dns": dns,
        "panel_https": web,
        "relay_ports_from_this_vantage": reachability,
        "same_host_443_trust_review": "required-manual-review",
        "required_companion_mode": "panel",
        "result": result,
        "enablement": "not-authorized-by-this-report",
    }


def run_panel(workforce_origin=None, csf_path="/etc/csf/csf.conf"):
    try:
        result = subprocess.run(["ss", "-H", "-ltn"], check=False, capture_output=True, text=True, timeout=4)
        listeners = parse_listener_output(result.stdout) if result.returncode == 0 else None
    except (OSError, subprocess.SubprocessError):
        listeners = None
    csf = read_csf_inbound_config(csf_path)
    wildcard = []
    if listeners is not None:
        wildcard = [row for row in listeners if row["port"] in RELAY_PORTS and row["address"] in ("0.0.0.0", "*", "[::]", "::")]
    upstream = {"state": "operator-origin-required"} if not workforce_origin else probe_private_origin(workforce_origin)
    rule_open = any(value == "listed" for value in csf.values())
    unsafe_upstream = upstream.get("state") in (
        "private-origin-invalid",
        "plain-http-requires-literal-loopback",
        "private-origin-must-resolve-only-to-private-addresses",
        "tls-verification-failed",
    )
    hard_blocker = bool(wildcard or rule_open or unsafe_upstream)
    incomplete = listeners is None or "unknown" in csf.values() or upstream.get("state") != "reachable"
    return {
        "mode": "panel",
        "candidate_host": CANDIDATE_HOST,
        "expected_panel_origin": f"https://{CANDIDATE_HOST}:2222",
        "expected_directadmin_provider": f"directadmin:https://{CANDIDATE_HOST}:2222",
        "local_listeners": listeners,
        "csf_configured_inbound_ports": csf,
        "private_workforce_origin": upstream,
        "required_companion_mode": "external",
        "result": "blocker" if hard_blocker else "incomplete" if incomplete else "evidence-only",
        "enablement": "not-authorized-by-this-report",
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("external", "panel"), help="run from an external network or on the DirectAdmin host")
    parser.add_argument("--workforce-origin", help="operator-supplied private #811 origin; no credential is sent")
    args = parser.parse_args(argv)
    if args.mode == "external" and args.workforce_origin:
        parser.error("--workforce-origin is only used in panel mode")
    report = run_external() if args.mode == "external" else run_panel(args.workforce_origin)
    print(json.dumps(report, sort_keys=True))
    return 2 if report["result"] == "blocker" else 1 if report["result"] == "incomplete" else 0


if __name__ == "__main__":
    sys.exit(main())
