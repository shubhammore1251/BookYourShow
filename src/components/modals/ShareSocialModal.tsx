import React, { useState } from "react";
import {
  FacebookShareButton,
  FacebookMessengerShareButton,
  TwitterShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  RedditShareButton,
  FacebookIcon,
  FacebookMessengerIcon,
  XIcon,
  TelegramIcon,
  WhatsappIcon,
  RedditIcon,
  ThreadsShareButton,
  ThreadsIcon,
  TwitterIcon,
} from "react-share";
import { X, Link2, Check } from "lucide-react";
import { ShareModalProps } from "@/lib/types/modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const ShareSocialModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  title,
  description = "",
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border border-gray-800 rounded-2xl text-white w-fit max-w-[95vw] px-8 py-6">
        <DialogHeader className="flex flex-row items-center justify-between mb-4">
          <DialogTitle className="text-2xl font-bold">Share</DialogTitle>
          {/* <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button> */}
        </DialogHeader>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col items-center gap-2">
            <FacebookShareButton url={shareUrl} hashtag={`#${title}`}>
              <FacebookIcon size={56} round />
            </FacebookShareButton>
            <span className="text-xs text-gray-400">Facebook</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <TwitterShareButton url={shareUrl} title={title}>
              <XIcon size={56} round />
            </TwitterShareButton>
            <span className="text-xs text-gray-400">X</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <TelegramShareButton url={shareUrl} title={title}>
              <TelegramIcon size={56} round />
            </TelegramShareButton>
            <span className="text-xs text-gray-400">Telegram</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <WhatsappShareButton url={shareUrl} title={title}>
              <WhatsappIcon size={56} round />
            </WhatsappShareButton>
            <span className="text-xs text-gray-400">WhatsApp</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <RedditShareButton url={shareUrl} title={title}>
              <RedditIcon size={56} round />
            </RedditShareButton>
            <span className="text-xs text-gray-400">Reddit</span>
          </div>
        </div>

        {/* Copy Link Section */}
        <div className="flex items-center gap-2 min-w-0">
          {/* URL box */}
          <div className="flex-1 bg-gray-800 rounded-lg px-4 py-3 text-sm text-gray-300 border border-gray-700 truncate min-w-0">
            {shareUrl}
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopyLink}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              copied
                ? "bg-green-600 hover:bg-green-700"
                : "bg-pink-600 hover:bg-pink-700"
            } text-white`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareSocialModal;
