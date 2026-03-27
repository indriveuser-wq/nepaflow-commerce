export const formatNPR = (amount: number): string => {
  return `रु ${amount.toLocaleString('en-NP', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const generateOrderNumber = (): string => {
  const prefix = 'BN';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const generateInvoiceNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}-${random}`;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    confirmed: 'bg-primary/10 text-primary border-primary/20',
    processing: 'bg-secondary/10 text-secondary border-secondary/20',
    completed: 'bg-success/10 text-success border-success/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
    delivered: 'bg-success/10 text-success border-success/20',
    in_transit: 'bg-primary/10 text-primary border-primary/20',
    picked_up: 'bg-secondary/10 text-secondary border-secondary/20',
    paid: 'bg-success/10 text-success border-success/20',
    partial: 'bg-warning/10 text-warning border-warning/20',
    failed: 'bg-destructive/10 text-destructive border-destructive/20',
    active: 'bg-success/10 text-success border-success/20',
    draft: 'bg-muted text-muted-foreground border-border',
    low_stock: 'bg-warning/10 text-warning border-warning/20',
    out_of_stock: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  return colors[status] || 'bg-muted text-muted-foreground border-border';
};
