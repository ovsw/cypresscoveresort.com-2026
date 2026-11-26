// Uploading image assets, shared by `pnpm seed` and `pnpm page:seed` so the
// two name and upload a sample image the same way.

/**
 * Upload one image asset. Sanity derives an image asset's ID from its bytes,
 * so uploading the same bytes twice gives the same ID.
 * @param {{ assets: { upload: Function } }} client
 * @param {{ buffer: Buffer, filename: string, contentType?: string }} asset
 */
export function uploadImageAsset(client, { buffer, filename, contentType = "image/png" }) {
  return client.assets.upload("image", buffer, { filename, contentType });
}
