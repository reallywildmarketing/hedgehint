import { describe, it, expect } from "vitest"
import { storage, MAX_UPLOAD_SIZE_BYTES } from "../src/lib/storage"

describe("Storage Adapter Verification (Phase G.7)", () => {
  it("uploads and downloads a real file with server-generated key", async () => {
    const originalContent = "sample_csv_data,USD,50000,2026-12-01\n"
    const buffer = Buffer.from(originalContent, "utf-8")

    const uploadRes = await storage.upload(buffer, "text/csv")
    expect(uploadRes.key).toMatch(/^upload_\d+_[a-f0-9-]+$/)
    expect(uploadRes.sizeBytes).toBe(buffer.length)

    // Download through adapter
    const downloadedBuffer = await storage.download(uploadRes.key)
    expect(downloadedBuffer.toString("utf-8")).toBe(originalContent)

    // Cleanup
    await storage.delete(uploadRes.key)
    await expect(storage.download(uploadRes.key)).rejects.toThrow("File not found")
  })

  it("rejects uploads exceeding the 4 MB platform request cap", async () => {
    // Construct a buffer of 4.1 MB
    const oversizedBuffer = Buffer.alloc(MAX_UPLOAD_SIZE_BYTES + 1024)

    await expect(storage.upload(oversizedBuffer, "application/octet-stream")).rejects.toThrow(
      "exceeds maximum limit of 4 MB"
    )
  })
})
