import { SSTConfig } from "sst";
import { NextjsSite, Table, Api } from "sst/constructs";

export default {
  config(_input) {
    return {
      name: "openaws",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      // DynamoDB table for user progress
      const table = new Table(stack, "UserProgress", {
        fields: {
          pk: "string",
          sk: "string",
          GSI1PK: "string",
          GSI1SK: "string",
        },
        primaryIndex: { partitionKey: "pk", sortKey: "sk" },
        globalIndexes: {
          GSI1: { partitionKey: "GSI1PK", sortKey: "GSI1SK" },
        },
      });

      // API for progress tracking
      const api = new Api(stack, "Api", {
        defaults: {
          function: {
            bind: [table],
          },
        },
        routes: {
          "GET /api/progress": "packages/functions/src/progress.handler",
          "POST /api/progress": "packages/functions/src/progress.handler",
          "GET /api/review-queue": "packages/functions/src/reviewQueue.handler",
          "POST /api/exam-attempt": "packages/functions/src/examAttempt.handler",
        },
      });

      // Next.js site
      const site = new NextjsSite(stack, "Site", {
        bind: [table, api],
        environment: {
          NEXT_PUBLIC_API_URL: api.url,
        },
      });

      stack.addOutputs({
        SiteUrl: site.url,
        ApiUrl: api.url,
      });
    });
  },
} satisfies SSTConfig;
