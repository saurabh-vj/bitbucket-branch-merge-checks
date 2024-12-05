import api, { route, routeFromAbsolute } from "@forge/api";
//import { PullRequest, RelatedPullRequest } from "../types";

export const run = async (event, context) => {
  
  const workspaceId = context.workspaceId;
  const repoId = context.extension.repository.uuid;
  const prId = context.extension.pullRequest.id;

  const pr = await getPullRequest(workspaceId, repoId, prId);

  if (pr.destination.branch.name.toLower() === "staging") {
    return {
      success: false,
      message: `Pull request #${event.pullrequest.id} is not ready to be merged.`
    };
  } else {
    return {
      success: true
    };
  }
};

const getPullRequest = async (workspaceId, repoId, prId) => {
  const res = await api
    .asApp()
    .requestBitbucket(
      route`/2.0/repositories/${workspaceId}/${repoId}/pullrequests/${prId}`,
    );

  return res.json();
};

/**export const getPullRequestContainingIssueKeys = async (
  workspaceId: string,
  repoId: string,
  prId: number,
  issueKeys: RegExpMatchArray,
): Promise<RelatedPullRequest[]> => {
  // Note: Bitbucket filtering can only check the title contains the issue key, not whether the issue key is an exact match.
  // E.g. if the issue key is "ABC-123", the title "ABC-1234" will also be matched.
  const issueInTitleCondition = issueKeys
    .map((key) => `title ~ "${key}"`)
    .join(" OR ");
  const query = `id!=${prId} AND (${issueInTitleCondition})`;

  const relevantFields =
    "next,values.id,values.title,values.state,values.links.html";

  const apiRoute = route`/2.0/repositories/${workspaceId}/${repoId}/pullrequests?q=${query}&fields=${relevantFields}`;
  let resp = await api.asApp().requestBitbucket(apiRoute);
  let result = await resp.json();

  const relatedPrs = result.values;

  // Paginate through all results
  while (result.next) {
    resp = await api.asApp().requestBitbucket(routeFromAbsolute(result.next));
    result = await resp.json();
    relatedPrs.push(...result.values);
  }

  return relatedPrs;
};

export const getRelatedPullRequests = async (
  workspaceId: string,
  repoId: string,
  prId: number,
  issueKeys: RegExpMatchArray,
): Promise<RelatedPullRequest[]> => {
  const prsContainingIssueKeys = await getPullRequestContainingIssueKeys(
    workspaceId,
    repoId,
    prId,
    issueKeys,
  );

  // Further filter down to only PRs that contain an exact match of any of the provided issue keys
  const issueKeyPattern = new RegExp(`\\b(${issueKeys.join("|")})\\b`, "i");
  return prsContainingIssueKeys.filter(
    (pr) => !!pr.title.match(issueKeyPattern),
  );
};*/
