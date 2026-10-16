import type { BackendConfig } from './config/backendConfig.ts';
import {
  guardRequest,
  type RequestLike,
  type ResponseLike,
  sendError,
  sendJson,
} from './http/guard.ts';
import type { IdentityCheck } from './identity/check.ts';
import type { Log, LogOutcome } from './log.ts';

/**
 * `GET /whoami` (D-162): the example endpoint for the identity check. It answers only whether the
 * customer's token is valid, `{"status":"ok"}`, never the customer's ID or details.
 *
 * **Development only:** it answers `not_found` unless the backend's environment is `development`,
 * and it is deployed only to the development Firebase project, never to staging or production
 * (owner, P10-01 plan approval).
 */
export interface WhoAmIDependencies {
  /** Undefined when the configuration is missing or malformed. */
  readonly config: BackendConfig | undefined;
  readonly identityCheck: IdentityCheck | undefined;
  readonly log: Log;
  readonly now: () => number;
}

const METHODS = ['GET'] as const;

export async function handleWhoAmI(
  request: RequestLike,
  response: ResponseLike,
  dependencies: WhoAmIDependencies,
): Promise<void> {
  const started = dependencies.now();
  let outcome: LogOutcome;
  try {
    outcome = await respond(request, response, dependencies);
  } catch {
    outcome = 'internal';
    sendError(response, 'internal');
  }
  dependencies.log.write({ event: 'whoami', outcome, millis: dependencies.now() - started });
}

async function respond(
  request: RequestLike,
  response: ResponseLike,
  { config, identityCheck }: WhoAmIDependencies,
): Promise<LogOutcome> {
  if (config === undefined || identityCheck === undefined) {
    sendError(response, 'not_configured');
    return 'not_configured';
  }
  if (config.environment !== 'development') {
    sendError(response, 'not_found');
    return 'not_found';
  }
  const refused = guardRequest(request, { methods: METHODS, maxBodyBytes: 0 });
  if (refused !== undefined) {
    sendError(response, refused, METHODS);
    return refused;
  }
  const identity = await identityCheck(request.headers.authorization);
  if (!identity.ok) {
    sendError(response, identity.code);
    return identity.code;
  }
  // identity.customerId is known here; later endpoints use it. This one never returns it.
  sendJson(response, 200, { status: 'ok' });
  return 'ok';
}
