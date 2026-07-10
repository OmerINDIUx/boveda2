import {
  File,
  FileArchive,
  FileAxis3d,
  FileChartColumn,
  FileCode2,
  FileEdit,
  FileImage,
  FileMusic,
  FileSpreadsheet,
  FileText,
  FileType,
  FileVideo,
  type LucideIcon,
} from 'lucide-react';

type FileIconConfig = {
  icon: LucideIcon;
  color: string;
};

const extensionMap: Record<string, FileIconConfig> = {
  pdf: { icon: FileText, color: '#ef4444' },
  doc: { icon: FileEdit, color: '#2563eb' },
  docx: { icon: FileEdit, color: '#2563eb' },
  odt: { icon: FileEdit, color: '#2563eb' },
  xls: { icon: FileSpreadsheet, color: '#16a34a' },
  xlsx: { icon: FileSpreadsheet, color: '#16a34a' },
  ods: { icon: FileSpreadsheet, color: '#16a34a' },
  ppt: { icon: FileChartColumn, color: '#ea580c' },
  pptx: { icon: FileChartColumn, color: '#ea580c' },
  odp: { icon: FileChartColumn, color: '#ea580c' },
  jpg: { icon: FileImage, color: '#9333ea' },
  jpeg: { icon: FileImage, color: '#9333ea' },
  png: { icon: FileImage, color: '#9333ea' },
  gif: { icon: FileImage, color: '#9333ea' },
  svg: { icon: FileImage, color: '#9333ea' },
  webp: { icon: FileImage, color: '#9333ea' },
  bmp: { icon: FileImage, color: '#9333ea' },
  mp4: { icon: FileVideo, color: '#0891b2' },
  avi: { icon: FileVideo, color: '#0891b2' },
  mov: { icon: FileVideo, color: '#0891b2' },
  mkv: { icon: FileVideo, color: '#0891b2' },
  webm: { icon: FileVideo, color: '#0891b2' },
  mp3: { icon: FileMusic, color: '#db2777' },
  wav: { icon: FileMusic, color: '#db2777' },
  flac: { icon: FileMusic, color: '#db2777' },
  aac: { icon: FileMusic, color: '#db2777' },
  ogg: { icon: FileMusic, color: '#db2777' },
  zip: { icon: FileArchive, color: '#78716c' },
  rar: { icon: FileArchive, color: '#78716c' },
  '7z': { icon: FileArchive, color: '#78716c' },
  gz: { icon: FileArchive, color: '#78716c' },
  tar: { icon: FileArchive, color: '#78716c' },
  json: { icon: FileCode2, color: '#6366f1' },
  xml: { icon: FileCode2, color: '#6366f1' },
  js: { icon: FileCode2, color: '#6366f1' },
  ts: { icon: FileCode2, color: '#6366f1' },
  css: { icon: FileCode2, color: '#6366f1' },
  html: { icon: FileCode2, color: '#6366f1' },
  txt: { icon: FileType, color: '#64748b' },
  csv: { icon: FileType, color: '#64748b' },
  dwg: { icon: FileAxis3d, color: '#84cc16' },
  dxf: { icon: FileAxis3d, color: '#84cc16' },
  ifc: { icon: FileAxis3d, color: '#84cc16' },
  rvt: { icon: FileAxis3d, color: '#84cc16' },
  obj: { icon: FileAxis3d, color: '#84cc16' },
  fbx: { icon: FileAxis3d, color: '#84cc16' },
  stl: { icon: FileAxis3d, color: '#84cc16' },
};

const defaultConfig: FileIconConfig = { icon: File, color: '#9ca3af' };

export function getFileIcon(extension?: string | null): FileIconConfig {
  if (!extension) return defaultConfig;
  const key = extension.toLowerCase().replace(/^\./, '');
  return extensionMap[key] ?? defaultConfig;
}
