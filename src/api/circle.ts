// Module
import { CircleCI, CircleCIOptions, GitType } from "circleci-api";

import { safelyFetchEnvs } from "../envs";

const { CIRCLE_TOKEN } = safelyFetchEnvs(["CIRCLE_TOKEN"]);

export class Circle {
  private owner: string;
  private repo: string;
  private api: CircleCI;

  constructor({ owner, repo }: { owner: string; repo: string }) {
    this.owner = owner;
    this.repo = repo;

    // Configure the factory with some defaults
    const options: CircleCIOptions = {
      // Required for all requests
      token: CIRCLE_TOKEN, // Set your CircleCi API token

      // Git information is required for project/build/etc endpoints
      vcs: {
        type: GitType.GITHUB, // default: github
        owner,
        repo
      }
    };

    // Create the api object
    this.api = new CircleCI(options);
  }
}
