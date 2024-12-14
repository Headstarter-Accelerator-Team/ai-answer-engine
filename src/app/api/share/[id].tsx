import type { NextApiRequest, NextApiResponse } from "next";
import { sharedDataStore } from "../share";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === "GET") {
    const sharedData = sharedDataStore.get(id as string);

    if (!sharedData) {
      return res.status(404).json({ message: "Data not found" });
    }

    res.status(200).json(sharedData);
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
