// Dialog.tsx
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DialogProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

export function Dialog({
    open,
    onClose,
    children,
    className = "",
}: DialogProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        if (open) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [open, onClose]);

    const handleOverlayClick = (event: React.MouseEvent) => {
        if (event.target === overlayRef.current) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={overlayRef}
                    className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleOverlayClick}
                >
                    <div className="min-h-screen px-4 text-center">
                        <span
                            className="inline-block h-screen align-middle"
                            aria-hidden="true"
                        >
                            &#8203;
                        </span>
                        <motion.div
                            className={`inline-block w-full align-middle ${className}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{
                                duration: 0.2,
                                ease: [0.4, 0, 0.2, 1],
                            }}
                        >
                            {children}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function DialogContent({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`relative transform overflow-hidden rounded-lg bg-gray-900 border border-gray-700 px-6 py-5 text-left shadow-xl transition-all max-w-2xl mx-auto ${className}`}
        >
            {children}
        </div>
    );
}

export function DialogHeader({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function DialogTitle({
    image,
    title,
    subtitle,
    className = "",
}: {
    image: string;
    title: string;
    subtitle: string;
    className?: string;
}) {
    return (
        <div className={`flex items-start gap-4 ${className}`}>
            <div className="w-24 h-24 flex-shrink-0">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover rounded-lg"
                />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-gray-100 mb-1">
                    {title}
                </h3>
                <p className="text-sm text-gray-400">{subtitle}</p>
            </div>
        </div>
    );
}

export function DialogFooter({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`mt-6 flex justify-end gap-3 ${className}`}>
            {children}
        </div>
    );
}
