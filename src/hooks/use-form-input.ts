import { useRef, useState, ChangeEvent } from "react";

interface FormInputHook<T> {
	value: T;
	ref: React.RefObject<HTMLInputElement | null>;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const useFormInput = <T extends string | boolean>(initialValue: T): FormInputHook<T> => {
	const [value, setValue] = useState<T>(initialValue);
	const ref = useRef<HTMLInputElement>(null);

	const onChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (typeof initialValue === 'boolean') {
			setValue(event.target.checked as T);
		} else {
			setValue(event.target.value as T);
		}
	};

	return {
		value,
		ref,
		onChange,
	};
};

export default useFormInput;