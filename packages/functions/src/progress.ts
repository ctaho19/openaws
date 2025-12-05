import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Table } from "sst/node/table";
import { UserProfile, QuestionProgress, RecordProgressInput } from "./types";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USER_ID = "default-user";

function calculateNextReview(
  isCorrect: boolean,
  confidence: "low" | "medium" | "high"
): string {
  const now = new Date();
  let daysToAdd = 1;

  if (!isCorrect) {
    daysToAdd = 1;
  } else if (confidence === "low") {
    daysToAdd = 1;
  } else if (confidence === "medium") {
    daysToAdd = 2;
  } else {
    daysToAdd = 4;
  }

  now.setDate(now.getDate() + daysToAdd);
  return now.toISOString();
}

async function getProgress(): Promise<{
  profile: UserProfile | null;
}> {
  const result = await docClient.send(
    new GetCommand({
      TableName: Table.UserProgress.tableName,
      Key: { pk: `USER#${USER_ID}`, sk: "PROFILE" },
    })
  );

  return { profile: (result.Item as UserProfile) || null };
}

async function recordProgress(input: RecordProgressInput): Promise<void> {
  const now = new Date().toISOString();
  const nextReviewAt = calculateNextReview(input.isCorrect, input.confidence);

  const existingQuestion = await docClient.send(
    new GetCommand({
      TableName: Table.UserProgress.tableName,
      Key: {
        pk: `USER#${USER_ID}`,
        sk: `QUESTION#${input.questionId}`,
      },
    })
  );

  const attempts = existingQuestion.Item
    ? (existingQuestion.Item as QuestionProgress).attempts + 1
    : 1;

  const questionProgress: QuestionProgress = {
    pk: `USER#${USER_ID}`,
    sk: `QUESTION#${input.questionId}`,
    questionId: input.questionId,
    isCorrect: input.isCorrect,
    confidence: input.confidence,
    timeSpent: input.timeSpent,
    attempts,
    lastAttemptAt: now,
    nextReviewAt,
    GSI1PK: `USER#${USER_ID}#REVIEW`,
    GSI1SK: nextReviewAt,
  };

  await docClient.send(
    new PutCommand({
      TableName: Table.UserProgress.tableName,
      Item: questionProgress,
    })
  );

  const existingProfile = await docClient.send(
    new GetCommand({
      TableName: Table.UserProgress.tableName,
      Key: { pk: `USER#${USER_ID}`, sk: "PROFILE" },
    })
  );

  const profile = existingProfile.Item as UserProfile | undefined;
  const lastAnswered = profile?.lastAnsweredAt
    ? new Date(profile.lastAnsweredAt)
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = profile?.currentStreak || 0;
  if (lastAnswered) {
    const lastDate = new Date(lastAnswered);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      currentStreak += 1;
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  const domain = input.domain || "general";
  const domainStats = profile?.domainStats || {};
  if (!domainStats[domain]) {
    domainStats[domain] = { answered: 0, correct: 0 };
  }
  domainStats[domain].answered += 1;
  if (input.isCorrect) {
    domainStats[domain].correct += 1;
  }

  const xpGained = input.isCorrect ? 10 : 2;

  await docClient.send(
    new UpdateCommand({
      TableName: Table.UserProgress.tableName,
      Key: { pk: `USER#${USER_ID}`, sk: "PROFILE" },
      UpdateExpression: `
        SET totalQuestionsAnswered = if_not_exists(totalQuestionsAnswered, :zero) + :one,
            totalCorrect = if_not_exists(totalCorrect, :zero) + :correct,
            currentStreak = :streak,
            longestStreak = if_not_exists(longestStreak, :zero),
            lastAnsweredAt = :now,
            xp = if_not_exists(xp, :zero) + :xp,
            domainStats = :domainStats,
            createdAt = if_not_exists(createdAt, :now),
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ":zero": 0,
        ":one": 1,
        ":correct": input.isCorrect ? 1 : 0,
        ":streak": currentStreak,
        ":now": now,
        ":xp": xpGained,
        ":domainStats": domainStats,
      },
    })
  );

  if (currentStreak > (profile?.longestStreak || 0)) {
    await docClient.send(
      new UpdateCommand({
        TableName: Table.UserProgress.tableName,
        Key: { pk: `USER#${USER_ID}`, sk: "PROFILE" },
        UpdateExpression: "SET longestStreak = :streak",
        ExpressionAttributeValues: { ":streak": currentStreak },
      })
    );
  }
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    if (event.requestContext.http.method === "GET") {
      const { profile } = await getProgress();
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionsAnswered: profile?.totalQuestionsAnswered || 0,
          accuracy:
            profile && profile.totalQuestionsAnswered > 0
              ? (profile.totalCorrect / profile.totalQuestionsAnswered) * 100
              : 0,
          domainStats: profile?.domainStats || {},
          streak: profile?.currentStreak || 0,
          longestStreak: profile?.longestStreak || 0,
          xp: profile?.xp || 0,
        }),
      };
    }

    if (event.requestContext.http.method === "POST") {
      const body = JSON.parse(event.body || "{}") as RecordProgressInput;

      if (!body.questionId || typeof body.isCorrect !== "boolean") {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Missing required fields" }),
        };
      }

      await recordProgress({
        questionId: body.questionId,
        isCorrect: body.isCorrect,
        confidence: body.confidence || "medium",
        timeSpent: body.timeSpent || 0,
        domain: body.domain,
      });

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Error in progress handler:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
