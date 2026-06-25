export const getYouTubeId = (url = "") => {
  const s = String(url);
  const m =
    s.match(/youtu\.be\/([^?&#/]+)/) ||
    s.match(/youtube\.com\/watch\?v=([^?&#/]+)/);
  return m?.[1] || "";
};

export const getThumbnailUrl = (id = "") =>
  `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
