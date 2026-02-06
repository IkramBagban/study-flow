import { v2 as cloudinary } from 'cloudinary';

// Interface for Storage Provider (Adapter Pattern)
export interface StorageProvider {
    upload(file: File, path: string): Promise<{ url: string; key: string }>;
    delete(key: string): Promise<void>;
}

// ----------------------------------------------------------------------
// Cloudinary Implementation
// ----------------------------------------------------------------------
class CloudinaryStorageProvider implements StorageProvider {
    constructor() {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.warn("⚠️ Cloudinary credentials missing. File upload will fail.");
        }

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }

    async upload(file: File, path: string): Promise<{ url: string; key: string }> {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: path, // e.g., 'study-flow/courses/123'
                    resource_type: 'auto', // auto-detect 'pdf', 'image', etc.
                    use_filename: true,
                    unique_filename: true,
                },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    if (!result) {
                        return reject(new Error("Cloudinary upload failed: No result returned"));
                    }

                    resolve({
                        url: result.secure_url,
                        key: result.public_id, // We need this to delete it later
                    });
                }
            );

            // Pipe the buffer into the stream
            uploadStream.end(buffer);
        });
    }

    async delete(key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(key, (error, result) => {
                if (error) return reject(error);
                resolve();
            });
        });
    }
}

// ----------------------------------------------------------------------
// Factory / Singleton
// ----------------------------------------------------------------------

// Future: We could swap this for S3StorageProvider based on env var
const storageProvider = new CloudinaryStorageProvider();

export const StorageService = {
    /**
     * Uploads a file to the configured storage provider
     * @param file The standard File object from FormData
     * @param folder The folder path (e.g., "courses/{id}")
     */
    upload: async (file: File, folder: string) => {
        return storageProvider.upload(file, `study-flow/${folder}`);
    },

    /**
     * Deletes a file from storage
     * @param key The unique key/public_id returned during upload
     */
    delete: async (key: string) => {
        return storageProvider.delete(key);
    }
};
