import { v4 as uuidv4 } from "uuid";
import type { NextApiRequest, NextApiResponse } from "next";

const sharedDataStore = new Map<string, unknown>(); // Temporary in-memory store

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ message: "No data provided" });
    }

    const uniqueId = uuidv4();
    sharedDataStore.set(uniqueId, data);

    const shareableUrl = `${req.headers.origin}/api/share/${uniqueId}`;
    res.status(200).json({ url: shareableUrl });
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}

export { sharedDataStore };
