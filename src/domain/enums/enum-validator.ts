import { DomainError } from "@domain/exceptions/DomainError";

export function enumValidator<const T extends Record<string, string>>(
	enumObj: T,
) {
	const validValues = Object.values(enumObj);

	return (value: unknown, field: string) => {
		if (!validValues.includes(value as T[keyof T])) {
			if (validValues.length === 1) {
				throw new DomainError(
					`Invalid value for "${field}": received "${value}", expected "${validValues[0]}"`,
				);
			}
			throw new DomainError(
				`Invalid value for "${field}": received "${value}", expected one of: ${validValues.join(", ")}`,
			);
		}
		return value as T[keyof T];
	};
}
