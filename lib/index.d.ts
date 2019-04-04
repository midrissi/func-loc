export interface ILocation {
  source: string;
  line: number;
  column: number;
}

/**
 * Locate a function
 * @param {(...args: any[]) => void} fn The function to locate
 * @returns {Promise<ILocation>} An object containing the source file, the line and column where the column was
 * defined
 */
export function locate(fn: (...args: any[]) => any): Promise<ILocation>;

/**
 * Release created resources
 * @returns {Boolean} true if everything is ok, false otherwise
 */
export function clean(): boolean;
