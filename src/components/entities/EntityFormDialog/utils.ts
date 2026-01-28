/**
 * Extract date of birth from Romanian CNP (Personal Numeric Code)
 * CNP format: SAABBCCJJNNNC
 * S = sex/century digit
 * AA = year (2 digits)
 * BB = month
 * CC = day
 * JJ = county code
 * NNN = sequence number
 * C = control digit
 */
export const extractDOBFromCNP = (cnp: string): string | null => {
  if (!cnp || cnp.length !== 13) return null;

  try {
    const sexCentury = parseInt(cnp[0]);
    const year = parseInt(cnp.substring(1, 3));
    const month = parseInt(cnp.substring(3, 5));
    const day = parseInt(cnp.substring(5, 7));

    // Determine century based on first digit
    let century: number;
    if (sexCentury === 1 || sexCentury === 2) {
      century = 1900;
    } else if (sexCentury === 3 || sexCentury === 4) {
      century = 1800;
    } else if (sexCentury === 5 || sexCentury === 6) {
      century = 2000;
    } else if (sexCentury === 7 || sexCentury === 8 || sexCentury === 9) {
      // Residents/foreigners - assume based on year
      century = year > 30 ? 1900 : 2000;
    } else {
      return null;
    }

    const fullYear = century + year;

    // Validate month and day
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    // Format as YYYY-MM-DD for date input
    return `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  } catch {
    return null;
  }
};
