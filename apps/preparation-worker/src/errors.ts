export class NotImplementedTp4Error extends Error {
  constructor(readonly todo: string) {
    super(`${todo} is not implemented yet`);
    this.name = 'NotImplementedTp4Error';
  }
}

/** Dépendance externe simulée indisponible (HTTP 503). Erreur TEMPORAIRE : une nouvelle tentative peut réussir. */
export class TemporaryDependencyError extends Error {
  readonly status = 503;
  constructor(message = 'dependency answered 503') {
    super(message);
    this.name = 'TemporaryDependencyError';
  }
}
