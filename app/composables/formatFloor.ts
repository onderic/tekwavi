export const useFormatFloor = () => {
  const formatFloorNumber = (floorNumber?: number | string | null) => {
    if (floorNumber === undefined || floorNumber === null) {
      return { number: '-', suffix: '' }
    }

    const numericFloor = typeof floorNumber === 'string' ? Number(floorNumber) : floorNumber

    // Check for NaN after conversion
    if (isNaN(numericFloor)) {
      return { number: '-', suffix: '' }
    }

    // Handle ground floor (0)
    if (numericFloor === 0) {
      return { number: 'Ground', suffix: '' }
    }

    // Process floor numbers
    const lastDigit = numericFloor % 10
    const lastTwoDigits = numericFloor % 100

    // Handle special cases for 11th, 12th, 13th
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return { number: numericFloor, suffix: 'th' }
    }

    // Handle other cases
    switch (lastDigit) {
      case 1:
        return { number: numericFloor, suffix: 'st' }
      case 2:
        return { number: numericFloor, suffix: 'nd' }
      case 3:
        return { number: numericFloor, suffix: 'rd' }
      default:
        return { number: numericFloor, suffix: 'th' }
    }
  }

  return {
    formatFloorNumber,
  }
}
