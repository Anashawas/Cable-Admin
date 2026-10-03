import { useEffect, useRef, useState } from "react";
import TextField, { TextFieldProps } from "@mui/material/TextField";

export type DecimalFieldProps = Omit<TextFieldProps, "value" | "onChange" | "type"> & {
	/** Current numeric value (or null/"" for empty). */
	value: number | string | null | undefined;
	/** Called with the parsed number (or null when the field is empty/partial). */
	onValueChange: (value: number | null, raw: string) => void;
	/** Allow negative numbers (default false). */
	allowNegative?: boolean;
};

/**
 * A decimal-friendly text field. Unlike `<TextField type="number">`, this keeps a
 * raw string buffer while the user types, so partial entries like "0", "0.", "0.0"
 * and "0.01" are never collapsed to 0/1. It accepts 1, 0.1, 0.01, …, normalizes an
 * Arabic decimal separator (٫ ،) and comma to ".", and reports the parsed number
 * (or null when empty) via `onValueChange`.
 *
 * Drop-in replacement for a numeric MUI TextField:
 *   <DecimalField value={x} onValueChange={(n) => setX(n)} ... />
 */
export default function DecimalField({
	value,
	onValueChange,
	allowNegative = false,
	inputProps,
	...rest
}: DecimalFieldProps) {
	const toStr = (v: number | string | null | undefined) =>
		v === null || v === undefined ? "" : String(v);

	const [buffer, setBuffer] = useState<string>(toStr(value));
	const focused = useRef(false);

	// Mirror the external value into the buffer whenever it changes and the user is
	// NOT actively typing (so a form reset / dialog open / clamp updates the display,
	// but we never clobber a half-typed "0." mid-entry).
	useEffect(() => {
		if (!focused.current) setBuffer(toStr(value));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value]);

	const sanitize = (input: string): string => {
		// Normalize Arabic decimal separators and comma to a dot.
		let s = input.replace(/[٫،,]/g, ".");
		// Keep only digits, dot and (optional) leading minus.
		s = s.replace(allowNegative ? /[^\d.-]/g : /[^\d.]/g, "");
		if (allowNegative) {
			const neg = s.startsWith("-");
			s = s.replace(/-/g, "");
			if (neg) s = "-" + s;
		}
		// Collapse to a single dot.
		const first = s.indexOf(".");
		if (first !== -1) {
			s = s.slice(0, first + 1) + s.slice(first + 1).replace(/\./g, "");
		}
		return s;
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const s = sanitize(e.target.value);
		setBuffer(s);
		const parsed = s === "" || s === "." || s === "-" || s === "-." ? null : parseFloat(s);
		onValueChange(parsed != null && Number.isNaN(parsed) ? null : parsed, s);
	};

	return (
		<TextField
			{...rest}
			type="text"
			value={buffer}
			onChange={handleChange}
			onFocus={(e) => {
				focused.current = true;
				rest.onFocus?.(e);
			}}
			onBlur={(e) => {
				focused.current = false;
				setBuffer(toStr(value));
				rest.onBlur?.(e);
			}}
			inputProps={{ inputMode: "decimal", ...inputProps }}
		/>
	);
}
