import fs from "fs/promises"
import path from "path"
import os from "os"

export const MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024 // 4 MB cap (leaves headroom for Vercel 4.5 MB limit)

export interface StorageUploadResult {
  key: string
  sizeBytes: number
  contentType: string
}

export interface StorageAdapter {
  upload(fileBuffer: Buffer, contentType: string): Promise<StorageUploadResult>
  download(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
}

class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string

  constructor(customDir?: string) {
    this.baseDir = customDir || path.join(os.tmpdir(), "hedgehint-storage")
  }

  private async ensureDir() {
    await fs.mkdir(this.baseDir, { recursive: true })
  }

  async upload(fileBuffer: Buffer, contentType: string): Promise<StorageUploadResult> {
    if (fileBuffer.byteLength > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error(`File size (${fileBuffer.byteLength} bytes) exceeds maximum limit of 4 MB.`)
    }

    await this.ensureDir()
    // Server-generated opaque key (never user-supplied name to prevent directory traversal)
    const key = `upload_${Date.now()}_${crypto.randomUUID()}`
    const filePath = path.join(this.baseDir, key)

    await fs.writeFile(filePath, fileBuffer)

    return {
      key,
      sizeBytes: fileBuffer.byteLength,
      contentType,
    }
  }

  async download(key: string): Promise<Buffer> {
    // Sanitize key
    const safeKey = path.basename(key)
    const filePath = path.join(this.baseDir, safeKey)

    try {
      return await fs.readFile(filePath)
    } catch {
      throw new Error("File not found or storage error")
    }
  }

  async delete(key: string): Promise<void> {
    const safeKey = path.basename(key)
    const filePath = path.join(this.baseDir, safeKey)
    try {
      await fs.unlink(filePath)
    } catch {
      // Ignore if already deleted
    }
  }
}

// Singleton storage adapter instance
export const storage: StorageAdapter = new LocalStorageAdapter()
