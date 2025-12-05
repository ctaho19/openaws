import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Table } from "sst/node/table";
import { QuestionProgress } from "./types";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USER_ID = "default-user";

async function getReviewQueue(limit = 20): Promise<QuestionProgress[]> {
  const now = new Date().toISOString();

  const result = await docClient.send(
    new QueryCommand({
      TableName: Table.UserProgress.tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk AND GSI1SK <= :now",
      ExpressionAttributeValues: {
        ":pk": `USER#${USER_ID}#REVIEW`,
        ":now": now,
      },
      Limit: limit,
    })
  );

  return (result.Items || []) as QuestionProgress[];
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 20;

    const reviewQueue = await getReviewQueue(limit);

    const questions = reviewQueue.map((item) => ({
      questionId: item.questionId,
      lastAttemptAt: item.lastAttemptAt,
      nextReviewAt: item.nextReviewAt,
      attempts: item.attempts,
      lastCorrect: item.isCorrect,
      lastConfidence: item.confidence,
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        count: questions.length,
        questions,
      }),
    };
  } catch (error) {
    console.error("Error in review queue handler:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
