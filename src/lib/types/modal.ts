export interface ShareModalProps {
  isOpen: boolean;           // Controls modal visibility
  onClose: () => void;       // Function to close modal
  shareUrl: string;          // URL to share
  title: string;             // Title for sharing
  description?: string;      // Optional description
}