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

function checkKey(key: string) {
  if (!key || key.startsWith("/") || key.split("/").some((s) => !s || s === "." || s === "..")) {
    throw new Error("Invalid storage key.")
  }
}

function getSupabaseConfig(key: string) {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_BUCKET } = process.env
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !SUPABASE_BUCKET) {
    throw new Error("Supabase storage needs SUPABASE_URL, SUPABASE_SECRET_KEY and SUPABASE_BUCKET.")
  }
  const objectPath = key.split("/").map(encodeURIComponent).join("/")
  return {
    url: `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${objectPath}`,
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
    },
  }
}

class SupabaseStorageAdapter implements StorageAdapter {
  async upload(fileBuffer: Buffer, contentType: string): Promise<StorageUploadResult> {
    if (fileBuffer.byteLength > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error(`File size (${fileBuffer.byteLength} bytes) exceeds maximum limit of 4 MB.`)
    }
    const key = `upload_${Date.now()}_${crypto.randomUUID()}`
    checkKey(key)

    const s = getSupabaseConfig(key)
    const res = await fetch(s.url, {
      method: "POST",
      headers: { ...s.headers, "Content-Type": contentType, "x-upsert": "false" },
      body: fileBuffer,
      cache: "no-store",
    })

    if (!res.ok) {
      throw new Error(`Supabase storage upload failed with status ${res.status}`)
    }

    return { key, sizeBytes: fileBuffer.byteLength, contentType }
  }

  async download(key: string): Promise<Buffer> {
    checkKey(key)
    const s = getSupabaseConfig(key)
    const res = await fetch(s.url, { headers: s.headers, cache: "no-store" })
    if (!res.ok) {
      throw new Error(`Supabase storage download failed with status ${res.status}`)
    }
    return Buffer.from(await res.arrayBuffer())
  }

  async delete(key: string): Promise<void> {
    checkKey(key)
    const s = getSupabaseConfig(key)
    const res = await fetch(s.url, { method: "DELETE", headers: s.headers, cache: "no-store" })
    if (!res.ok && res.status !== 404) {
      throw new Error(`Supabase storage delete failed with status ${res.status}`)
    }
  }
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
      // Ignore
    }
  }
}

export const storage: StorageAdapter =
  process.env.STORAGE_DRIVER === "supabase" ? new SupabaseStorageAdapter() : new LocalStorageAdapter()

