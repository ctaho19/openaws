import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Table } from "sst/node/table";
import { ExamAttempt, ExamAttemptInput } from "./types";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USER_ID = "default-user";

async function recordExamAttempt(input: ExamAttemptInput): Promise<string> {
  const now = new Date().toISOString();
  const timestamp = Date.now();

  const examAttempt: ExamAttempt = {
    pk: `USER#${USER_ID}`,
    sk: `EXAMATTEMPT#${timestamp}`,
    score: input.score,
    totalQuestions: input.totalQuestions,
    duration: input.duration,
    domainBreakdown: input.domainBreakdown,
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: Table.UserProgress.tableName,
      Item: examAttempt,
    })
  );

  return `EXAMATTEMPT#${timestamp}`;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    if (event.requestContext.http.method !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const body = JSON.parse(event.body || "{}") as ExamAttemptInput;

    if (
      typeof body.score !== "number" ||
      typeof body.totalQuestions !== "number" ||
      typeof body.duration !== "number"
    ) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing required fields: score, totalQuestions, duration",
        }),
      };
    }

    const attemptId = await recordExamAttempt({
      score: body.score,
      totalQuestions: body.totalQuestions,
      duration: body.duration,
      domainBreakdown: body.domainBreakdown || {},
    });

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        attemptId,
        percentage: ((body.score / body.totalQuestions) * 100).toFixed(1),
      }),
    };
  } catch (error) {
    console.error("Error in exam attempt handler:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
