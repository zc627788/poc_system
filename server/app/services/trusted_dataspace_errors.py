class TrustedDataspaceError(ValueError):
    pass


class TrustedDataspaceValidationError(TrustedDataspaceError):
    pass


class TrustedDataspaceConflictError(TrustedDataspaceError):
    pass


class TrustedDataspaceNotFoundError(TrustedDataspaceError):
    pass


class TrustedDataspaceUpstreamError(TrustedDataspaceError):
    pass


class TrustedDataspaceReadTimeoutError(TrustedDataspaceUpstreamError):
    pass


class TrustedDataspaceConfigurationError(TrustedDataspaceUpstreamError):
    pass
