// Upload de fotos direto do navegador para o Cloudinary, com upload preset
// "unsigned": a API nao recebe o arquivo nem guarda segredo, so a URL final.
// Sem as duas variaveis abaixo, o cadastro volta a pedir a URL da foto.
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const photoUploadEnabled = Boolean(CLOUD_NAME && UPLOAD_PRESET);

export function validatePhoto(file: File): string | null {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type))
    return "Envie uma imagem JPG, PNG ou WEBP.";
  if (file.size > MAX_PHOTO_BYTES) return "A foto deve ter no maximo 5 MB.";
  return null;
}

export async function uploadPhoto(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", UPLOAD_PRESET ?? "");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body },
  );
  if (!res.ok) throw new Error("Nao foi possivel enviar a foto. Tente novamente.");
  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}
