/** @format */

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PrimaryButtonProps extends Omit<React.ComponentProps<typeof Button>, "onClick" | "children"> {
    children?: React.ReactNode;
    isLoading?: boolean;
    setLoading?: (loading: boolean) => void;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<any>;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    uiVariant?: "outline" | "filled";
    tone?: "dark" | "light";
    brand?: "google" | "facebook" | "default";
}

const brandStyles: Record<string, string> = {
    google: "bg-gradient-to-br from-rose-400 to-red-600 shadow-[0_4px_20px_rgba(66,133,244,0.4)]",
    facebook: "bg-gradient-to-br bg-gradient-to-br from-[#1877F2] to-[#1877F2] shadow-[0_4px_20px_rgba(24,119,242,0.4)]",
    default: "bg-gradient-to-br from-[#6346ff] to-[#8b6aff] shadow-[0_4px_20px_rgba(99,70,255,0.35)]",
};

const brandShine: Record<string, string> = {
    google: "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.25) 50%, transparent 80%)",
    facebook: "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.2) 50%, transparent 80%)",
    default: "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.18) 50%, transparent 80%)",
};

const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>((props, ref) => {
    const { children, className = "", disabled, isLoading, setLoading, onClick, leftIcon, rightIcon, uiVariant = "filled", tone = "dark", brand = "default", ...rest } = props;

    const [internalLoading, setInternalLoading] = useState(Boolean(isLoading));
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        setInternalLoading(Boolean(isLoading));
    }, [isLoading]);

    const setLoadingState = useCallback(
        (v: boolean) => {
            setInternalLoading(v);
            setLoading?.(v);
        },
        [setLoading],
    );

    const isDisabled = Boolean(disabled) || internalLoading;
    const isOutline = uiVariant === "outline";
    const isLight = tone === "light";

    const theme = useMemo(() => {
        if (isLight) {
            return {
                text: "text-black/80",
                outline: { base: "bg-emerald-50/80 border border-emerald-200 hover:bg-emerald-100/80" },
                wash: "linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0))",
                outlineShine: "linear-gradient(110deg, transparent 25%, rgba(34,197,94,0.08) 50%, transparent 75%)",
            };
        }
        return {
            text: "text-white/90",
            outline: { base: "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20" },
            wash: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0))",
            outlineShine: "linear-gradient(110deg, transparent 25%, rgba(34,197,94,0.12) 50%, transparent 75%)",
        };
    }, [isLight]);

    const handleClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            if (!onClick || isDisabled) return;
            try {
                const result = onClick(event);
                if (result && typeof (result as Promise<any>).then === "function") {
                    setLoadingState(true);
                    Promise.resolve(result).finally(() => setLoadingState(false));
                }
            } catch (err) {
                setLoadingState(false);
                throw err;
            }
        },
        [onClick, isDisabled, setLoadingState],
    );

    return (
        <Button
            {...rest}
            ref={ref}
            disabled={isDisabled}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            variant="ghost"
            className={cn(
                "relative isolate overflow-hidden h-12 rounded-xl px-6 font-medium text-[14.5px] cursor-pointer",
                "transition-all duration-200",
                theme.text,
                isOutline ? theme.outline.base : brandStyles[brand],
                isDisabled && "opacity-70 cursor-not-allowed",
                className,
            )}
        >
            {!isOutline && (
                <>
                    <span
                        className="pointer-events-none absolute inset-0"
                        style={{
                            backgroundImage: brandShine[brand],
                            backgroundSize: "220% 100%",
                            backgroundPosition: hovered ? "0% 0" : "100% 0",
                            opacity: hovered ? 1 : 0,
                            transition: "background-position 700ms ease, opacity 200ms ease",
                        }}
                    />
                    <span
                        className="pointer-events-none absolute inset-0"
                        style={{
                            backgroundImage: theme.wash,
                            opacity: hovered ? 1 : 0,
                            transition: "opacity 300ms ease",
                        }}
                    />
                </>
            )}

            {isOutline && (
                <span
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage: theme.outlineShine,
                        backgroundSize: "220% 100%",
                        backgroundPosition: hovered ? "0% 0" : "100% 0",
                        opacity: hovered ? 1 : 0,
                        transition: "background-position 700ms ease, opacity 200ms ease",
                    }}
                />
            )}
            {internalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <>
                    {leftIcon && <span className="relative z-10 inline-flex">{leftIcon}</span>}
                    <span className="relative z-10">{children}</span>
                    {rightIcon && <span className="relative z-10 inline-flex">{rightIcon}</span>}
                </>
            )}
        </Button>
    );
});

PrimaryButton.displayName = "PrimaryButton";
export { PrimaryButton };
