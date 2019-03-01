import retry from "@octokit/plugin-retry";
import throttling from "@octokit/plugin-throttling";
import GitHubApi from "@octokit/rest";

import { safelyFetchEnvs } from "../envs";

// @ts-ignore
const GitHubWithPlugins = GitHubApi.plugin(throttling).plugin(retry);

const { GH_TOKEN } = safelyFetchEnvs(["GH_TOKEN"]);

interface IssueOptions {
  owner: string;
  repo: string;
  number: number;
}

type GitHubOptions = Partial<IssueOptions> & {
  dryRun: boolean;
  owner: string;
  repo: string;
  pullRequest: string;
};

export class GitHub {
  private readonly _github: GitHubApi;
  private readonly _issueOpts: IssueOptions;

  constructor({ dryRun, owner, repo, pullRequest }: GitHubOptions) {
    this._github = new GitHubWithPlugins({
      auth: `token ${GH_TOKEN}`,

      throttle: {
        onRateLimit: (retryAfter: number, options: any) => {
          this._github.log.warn(
            `Request quota exhausted for request ${options.method} ${
              options.url
            }`
          );

          // retry three times
          if (options.request.retryCount < 3) {
            console.log(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
        },
        onAbuseLimit: (_retryAfter: number, options: any) => {
          // does not retry, only logs an error
          console.error(
            `Abuse detected for request ${options.method} ${options.url}`
          );
        }
      }
    });

    this._issueOpts = {
      owner,
      repo,
      number: parseInt(pullRequest.split("/").slice(-1)[0])
    };

    if (dryRun) {
      this._github.hook.wrap("request", (req, opts) => {
        if (opts.method === "GET") {
          return req(opts);
        }
        // tslint:disable-next-line:no-unused
        const { headers, request, body, method, ...otherOptions } = opts;
        console.log(`\nAttempting ${method} with options`, otherOptions);
        if (body) {
          console.log("body present but omitted for brevity");
        }
        return {
          data: []
        };
      });
    }
  }
}
