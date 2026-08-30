import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

/**
 * Validates a 9x9 sudoku grid: array of 9 rows, each an array of 9 integers 0-9.
 * (0 = empty cell.)
 */
@ValidatorConstraint({ name: 'isValidSudokuBoard', async: false })
export class IsValidSudokuBoardConstraint implements ValidatorConstraintInterface {
  validate(board: any): boolean {
    if (!Array.isArray(board) || board.length !== 9) return false;
    for (const row of board) {
      if (!Array.isArray(row) || row.length !== 9) return false;
      for (const cell of row) {
        if (!Number.isInteger(cell) || cell < 0 || cell > 9) return false;
      }
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a 9x9 grid of integers between 0 and 9`;
  }
}

export function IsValidSudokuBoard(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidSudokuBoardConstraint,
    });
  };
}
