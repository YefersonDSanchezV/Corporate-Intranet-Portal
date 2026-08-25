package co.com.icvc.intranet_backend.common.mapper;

import co.com.icvc.intranet_backend.common.exception.ValidationException;

import java.time.LocalDateTime;

public final class Mappers {

    private Mappers() {
    }

    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static LocalDateTime now() {
        return LocalDateTime.now();
    }

    public static <E extends Enum<E>> E enumValue(Class<E> enumType, String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ValidationException(message);
        }
        try {
            return Enum.valueOf(enumType, value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ValidationException(message);
        }
    }
}