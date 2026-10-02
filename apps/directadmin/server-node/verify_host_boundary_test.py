import importlib.util
import io
import json
import socket
import ssl
import subprocess
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch


SOURCE = Path(__file__).with_name("verify-host-boundary.py")
SPEC = importlib.util.spec_from_file_location("verify_host_boundary", SOURCE)
audit = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit)


class AuditTests(unittest.TestCase):
    def test_listener_parser_reports_only_allowlisted_ports_and_addresses(self):
        rows = audit.parse_listener_output("""
LISTEN 0 128 0.0.0.0:3010 0.0.0.0:*
LISTEN 0 128 127.0.0.1:3015 0.0.0.0:*
LISTEN 0 128 [::]:2222 [::]:*
LISTEN 0 128 127.0.0.1:8080 0.0.0.0:*
""")
        self.assertEqual(rows, [
            {"port": 2222, "address": "[::]"},
            {"port": 3010, "address": "0.0.0.0"},
            {"port": 3015, "address": "127.0.0.1"},
        ])

    def test_csf_config_is_reported_as_configured_ingress_not_effective_firewall(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory, "csf.conf")
            path.write_text('TCP_IN = "22,3000:3010"\nTCP6_IN = "80,443"\n', encoding="utf-8")
            self.assertEqual(audit.read_csf_inbound_config(path), {"3010": "listed", "3015": "not-listed"})
            path.write_text('TCP_IN = "22"\n', encoding="utf-8")
            self.assertEqual(audit.read_csf_inbound_config(path), {"3010": "unknown", "3015": "unknown"})
            self.assertEqual(audit.read_csf_inbound_config(Path(directory, "missing")), {"3010": "unknown", "3015": "unknown"})

    def test_private_origin_requires_https_private_resolution_or_literal_loopback_http(self):
        self.assertEqual(
            audit.parse_private_origin("http://127.0.0.1:3010"),
            {"scheme": "http", "host": "127.0.0.1", "port": 3010, "addresses": ["127.0.0.1"]},
        )
        self.assertEqual(
            audit.parse_private_origin("https://workforce.internal:3015", resolver=lambda host, port: ["10.20.0.8"])["addresses"],
            ["10.20.0.8"],
        )
        invalid = (
            "http://workforce.internal:3010",
            "http://198.51.100.2:3010",
            "https://workforce.example:3010",
            "https://workforce.internal:3010/path",
            "https://user:pass@workforce.internal:3010",
            "https://workforce.internal:3010?target=elsewhere",
            "https://workforce.internal:0",
        )
        for value in invalid:
            with self.subTest(value=value), self.assertRaises(ValueError):
                audit.parse_private_origin(value, resolver=lambda host, port: ["198.51.100.2"])
        with self.assertRaisesRegex(ValueError, "private-origin-must-resolve-only-to-private-addresses"):
            audit.parse_private_origin("https://mixed.internal:3010", resolver=lambda host, port: ["10.0.0.4", "203.0.113.7"])

    def test_private_origin_probe_pins_a_validated_address_and_sends_no_http_request(self):
        tls = Mock()
        tls.__enter__ = Mock(return_value=object())
        tls.__exit__ = Mock(return_value=False)
        context = Mock()
        context.wrap_socket.return_value = tls
        with patch.object(audit.socket, "create_connection", return_value=object()) as connect, \
             patch.object(audit.ssl, "create_default_context", return_value=context):
            result = audit.probe_private_origin(
                "https://workforce.internal:3010",
                resolver=lambda host, port: ["10.0.0.2", "10.0.0.1"],
            )
        self.assertEqual(result["state"], "reachable")
        connect.assert_called_once_with(("10.0.0.1", 3010), timeout=5)
        context.wrap_socket.assert_called_once()

    def test_panel_mode_always_marks_clean_findings_as_evidence_only(self):
        ss_result = subprocess.CompletedProcess(
            ["ss", "-H", "-ltn"], 0,
            "LISTEN 0 128 127.0.0.1:3010 0.0.0.0:*\nLISTEN 0 128 127.0.0.1:3015 0.0.0.0:*\n",
            "",
        )
        with patch.object(audit.subprocess, "run", return_value=ss_result), \
             patch.object(audit, "read_csf_inbound_config", return_value={"3010": "not-listed", "3015": "not-listed"}), \
             patch.object(audit, "probe_private_origin", return_value={"state": "reachable", "scheme": "https"}):
            report = audit.run_panel("https://workforce.internal:3010")
        self.assertEqual(report["result"], "evidence-only")
        self.assertEqual(report["enablement"], "not-authorized-by-this-report")

        public_bind = subprocess.CompletedProcess(
            ["ss", "-H", "-ltn"], 0,
            "LISTEN 0 128 0.0.0.0:3010 0.0.0.0:*\n",
            "",
        )
        with patch.object(audit.subprocess, "run", return_value=public_bind), \
             patch.object(audit, "read_csf_inbound_config", return_value={"3010": "not-listed", "3015": "not-listed"}), \
             patch.object(audit, "probe_private_origin", return_value={"state": "reachable", "scheme": "https"}):
            report = audit.run_panel("https://workforce.internal:3010")
        self.assertEqual(report["result"], "blocker")

    def test_external_probe_distinguishes_refused_exposed_and_indeterminate_ports(self):
        good_web = {
            "state": "observed",
            "status": 200,
            "redirect": None,
        }
        with patch.object(audit, "resolve_addresses", return_value=["216.219.85.159"]), \
             patch.object(audit, "probe_https", return_value=good_web), \
             patch.object(audit, "probe_tcp", side_effect=[{"state": "refused"}, {"state": "refused"}]):
            report = audit.run_external()
        self.assertEqual(report["result"], "evidence-only")
        self.assertEqual(report["required_companion_mode"], "panel")

        with patch.object(audit, "resolve_addresses", return_value=["216.219.85.159"]), \
             patch.object(audit, "probe_https", return_value=good_web), \
             patch.object(audit, "probe_tcp", side_effect=[{"state": "reachable"}, {"state": "refused"}]):
            report = audit.run_external()
        self.assertEqual(report["result"], "blocker")

        with patch.object(audit, "resolve_addresses", return_value=["216.219.85.159"]), \
             patch.object(audit, "probe_https", return_value=good_web), \
             patch.object(audit, "probe_tcp", side_effect=[{"state": "timeout"}, {"state": "refused"}]):
            report = audit.run_external()
        self.assertEqual(report["result"], "incomplete")

    def test_external_mode_rejects_non_global_dns_answers_before_any_probe(self):
        for answers in (["127.0.0.1"], ["8.8.8.8", "10.0.0.5"], ["192.0.2.10"],
                        ["::1"], ["::ffff:8.8.8.8"]):
            with self.subTest(answers=answers), \
                 patch.object(audit, "resolve_addresses", return_value=answers), \
                 patch.object(audit, "probe_https") as https_probe, \
                 patch.object(audit, "probe_tcp") as tcp_probe:
                report = audit.run_external()
            self.assertEqual(report["result"], "blocker")
            self.assertEqual(report["dns"]["state"], "rejected-non-global-answer")
            https_probe.assert_not_called()
            tcp_probe.assert_not_called()

    def test_external_mode_uses_only_the_single_validated_dns_snapshot(self):
        good_web = {"state": "observed", "status": 200, "redirect": None}
        resolver = Mock(return_value=["8.8.8.8"])
        with patch.object(audit, "resolve_addresses", resolver), \
             patch.object(audit, "probe_https", return_value=good_web) as https_probe, \
             patch.object(audit, "probe_tcp", return_value={"state": "refused"}) as tcp_probe:
            report = audit.run_external()
        self.assertEqual(report["result"], "evidence-only")
        resolver.assert_called_once_with(audit.CANDIDATE_HOST, 443)
        self.assertEqual(https_probe.call_count, len(audit.PANEL_PORTS))
        self.assertEqual(tcp_probe.call_count, len(audit.RELAY_PORTS))
        for call in https_probe.call_args_list + tcp_probe.call_args_list:
            self.assertEqual(call.kwargs["connect_address"], "8.8.8.8")

    def test_https_probe_pins_destination_and_preserves_tls_name_and_host_header(self):
        class FakeTLS:
            def __init__(self):
                self.request = None

            def sendall(self, request):
                self.request = request

            def makefile(self, mode):
                self.assert_mode = mode
                return io.BytesIO(b"HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n")

            def getpeercert(self):
                return {}

            def close(self):
                pass

        raw = object()
        tls = FakeTLS()
        context = Mock()
        context.wrap_socket.return_value = tls
        with patch.object(audit.socket, "create_connection", return_value=raw) as connect, \
             patch.object(audit.ssl, "create_default_context", return_value=context):
            result = audit.probe_https(
                "panel.example.test", 2222, connect_address="8.8.8.8", context=None
            )
        self.assertEqual(result["status"], 200)
        connect.assert_called_once_with(("8.8.8.8", 2222), timeout=5)
        context.wrap_socket.assert_called_once_with(raw, server_hostname="panel.example.test")
        self.assertIn(b"Host: panel.example.test:2222\r\n", tls.request)

    def test_tcp_probe_connects_to_explicit_pinned_address(self):
        socket_mock = MagicMock()
        with patch.object(audit.socket, "create_connection", return_value=socket_mock) as connect:
            self.assertEqual(audit.probe_tcp("panel.example.test", 3010, connect_address="8.8.8.8"),
                             {"state": "reachable"})
        connect.assert_called_once_with(("8.8.8.8", 3010), timeout=3)

    def test_redirect_path_title_body_and_cookie_values_are_not_returned_by_https_probe(self):
        with tempfile.TemporaryDirectory() as directory:
            cert = Path(directory, "panel.crt")
            key = Path(directory, "panel.key")
            subprocess.run([
                "openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes",
                "-keyout", str(key), "-out", str(cert), "-subj", "/CN=127.0.0.1",
                "-days", "1", "-addext", "subjectAltName=IP:127.0.0.1",
            ], check=True, capture_output=True)

            seen = []
            seen_headers = []

            class Handler(BaseHTTPRequestHandler):
                def do_GET(self):
                    seen.append(self.path)
                    seen_headers.append(dict(self.headers.items()))
                    self.send_response(302)
                    self.send_header("Location", "/evo/private-test-path?state=private-test-state")
                    self.send_header("Set-Cookie", "__Host-titan-da-session=private-test-cookie; Path=/; Secure; HttpOnly")
                    self.send_header("Content-Type", "text/html")
                    self.end_headers()
                    self.wfile.write(b"<title>private-test-title</title>private-test-body")

                def log_message(self, _format, *_args):
                    pass

            server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
            server_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            server_context.load_cert_chain(certfile=str(cert), keyfile=str(key))
            server.socket = server_context.wrap_socket(server.socket, server_side=True)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                client_context = ssl.create_default_context(cafile=str(cert))
                result = audit.probe_https("127.0.0.1", server.server_port, context=client_context)
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)

        self.assertEqual(seen, ["/"])
        self.assertNotIn("Cookie", seen_headers[0])
        self.assertNotIn("Authorization", seen_headers[0])
        self.assertEqual(result["status"], 302)
        self.assertEqual(result["redirect"], {"same_origin": True})
        self.assertEqual(result["set_cookie_names"], ["__Host-titan-da-session"])
        self.assertEqual(result["html_title_sha256"], audit.hashlib.sha256(b"private-test-title").hexdigest())
        serialized = json.dumps(result)
        for secret in ("private-test-path", "private-test-state", "private-test-cookie",
                       "private-test-title", "private-test-body"):
            self.assertNotIn(secret, serialized)

    def test_redirect_summary_emits_only_origin_match_boolean(self):
        result = audit._location_summary("server-216-219-85-159.da.direct", 2222,
                                         "https://titanzero.io:2222/evo/secret?state=secret")
        self.assertEqual(result, {"same_origin": False})
        same_origin = audit._location_summary("panel.example.test", 2222, "/evo/secret?state=secret")
        self.assertEqual(same_origin, {"same_origin": True})
        self.assertNotIn("titanzero.io", json.dumps(result))
        self.assertNotIn("secret", json.dumps(result) + json.dumps(same_origin))


if __name__ == "__main__":
    unittest.main()
