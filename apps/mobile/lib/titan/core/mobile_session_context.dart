import 'titan_session.dart';
import 'mobile_context_scope.dart';

/// Ephemeral server-authenticated mobile context.
/// A transition never carries queued commands into the next scope. It owns no business
/// authority; it only gates local work until the server has revalidated the
/// current company, actor, mode, entitlements and context revision.
class MobileSessionContext {
  TitanSession session;
  MobileScopeKey scope;
  Set<String> entitlements;
  String? bearerToken;
  bool authenticated;
  bool authorityRevalidated;
  bool frozen = false;

  MobileSessionContext({
    required this.session,
    required String contextRevision,
    required this.entitlements,
    this.bearerToken,
    this.authenticated = true,
    this.authorityRevalidated = false,
  }) : scope = MobileScopeKey(
          companyId: session.companyId,
          actorId: session.actorId,
          deviceId: session.deviceId,
          surface: session.surface,
          contextRevision: contextRevision,
        );

  bool get canReplay =>
      authenticated && authorityRevalidated && !frozen &&
      (bearerToken?.trim().isNotEmpty ?? false);

  void revalidate({
    required TitanSession nextSession,
    required String contextRevision,
    required Set<String> nextEntitlements,
    required String token,
  }) {
    if (token.trim().isEmpty) throw StateError('mobile-auth-token-required');
    session = nextSession;
    scope = MobileScopeKey(
      companyId: nextSession.companyId,
      actorId: nextSession.actorId,
      deviceId: nextSession.deviceId,
      surface: nextSession.surface,
      contextRevision: contextRevision,
    );
    entitlements = Set.unmodifiable(nextEntitlements);
    bearerToken = token;
    authenticated = true;
    authorityRevalidated = true;
    frozen = false;
  }

  void beginTransition() {
    frozen = true;
    authorityRevalidated = false;
  }

  void invalidate() {
    authenticated = false;
    authorityRevalidated = false;
    bearerToken = null;
    frozen = true;
  }

  bool acceptsScope(MobileScopeKey candidate) =>
      canReplay && candidate == scope;

  void assertReplayAllowed(MobileScopeKey candidate) {
    if (!acceptsScope(candidate)) {
      throw StateError('mobile-replay-context-revalidation-required');
    }
  }
}
