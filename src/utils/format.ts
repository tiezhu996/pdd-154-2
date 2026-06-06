export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    design: '设计稿',
    reference: '参考图',
    font: '字体包',
  };
  return labels[type] || type;
}

export function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    design: 'bg-blue-100 text-blue-700',
    reference: 'bg-purple-100 text-purple-700',
    font: 'bg-amber-100 text-amber-700',
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    upload: '上传',
    delete: '删除',
    move: '移动',
    download: '下载',
    share: '分享',
    edit: '编辑',
  };
  return labels[action] || action;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
