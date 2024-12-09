import api, { route, routeFromAbsolute } from "@forge/api";
//import { PullRequest, RelatedPullRequest } from "../types";

export const run = async (event, context) => {
  
  const workspaceId = event.workspace.uuid;
  const repoId = event.repository.uuid;
  const prId = event.pullrequest.id;

  const pr = await getPullRequest(workspaceId, repoId, prId);

  // Check if the pull request is raised for staging and
  // restrict it from merge if there is a pull request open for staging to master
  if (pr.destination.branch.name.toLowerCase() === "staging" && pr.source.branch.name.toLowerCase() !== "main") {
    const openPullRequests = await getOpenPullRequests(workspaceId, repoId);
    if (openPullRequests && openPullRequests.findIndex(p => 
      p.source.branch.name.toLowerCase() === "staging" &&
      p.destination.branch.name.toLowerCase() === "main"
    ) !== -1) {
      return {
        success: false,
        message: `There is an open pull request from staging to master.`,
      };
    }
  }

  return {
    success: true,
    message: "Pull request has passed staging check.",
  };
};

const getPullRequest = async (workspaceId, repoId, prId) => {
  const res = await api
    .asApp()
    .requestBitbucket(
      route`/2.0/repositories/${workspaceId}/${repoId}/pullrequests/${prId}`,
    );

  return res.json();
};

export const getOpenPullRequests = async (workspaceId, repoId) => {

  const apiRoute = route`/2.0/repositories/${workspaceId}/${repoId}/pullrequests?state=OPEN`;
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
