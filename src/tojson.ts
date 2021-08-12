import { Code } from './code';

export class ToJsonFunction {
  /**
   * The name the toJson function for a struct.
   */
  public readonly functionName: string;

  private readonly fields: Record<string, string> = {};

  constructor(
    private readonly baseType: string,
    private readonly allowAdditional = false,
    private readonly preserveCasing = false,
  ) {
    this.functionName = `toJson_${baseType}`;
  }

  /**
   * Adds a field to the struct.
   *
   * @param schemaName The name of the property in the schema ("to")
   * @param propertyName The name of the TypeScript property ("from")
   * @param toJson A function used to convert a value from JavaScript to schema
   * format. This could be `x => x` if no conversion is required.
   */
  public addField(schemaName: string, propertyName: string, toJson: ToJson) {
    this.fields[schemaName] = toJson(`obj.${propertyName}`);
  }

  public emit(code: Code) {
    code.line();
    code.line('/**');
    code.line(` * Converts an object of type '${this.baseType}' to JSON representation.`);
    code.line(' */');
    code.line('/* eslint-disable max-len, quote-props */');
    code.openBlock(`export function ${this.functionName}(obj: ${this.baseType} | undefined): Record<string, any> | undefined`);
    code.line('if (obj === undefined) { return undefined; }');

    code.open('const result: Record<string, any> = {');
    for (const [k, v] of Object.entries(this.fields)) {
      code.line(`'${k}': ${v},`);
    }
    code.close('};');

    if (this.allowAdditional) {
      code.open('for (const [k, v] of Object.entries(obj)) {');
      if (this.preserveCasing) {
        code.line('const key = k;');
      } else {
        code.line('const key = k.replace(/^./, k[0].toUpperCase());');
      }
      code.open('if (!result[key]) {');
      code.line('result[key] = v;');
      code.close('};');
      code.close('};');
    }

    code.line('// filter undefined values');
    code.line('return Object.entries(result).reduce((r, [k, v]) => (v === undefined) ? r : ({ ...r, [k]: v }), {});');

    code.closeBlock();
    code.line('/* eslint-enable max-len, quote-props */');
  }
}

/**
 * A function that converts an expression from JavaScript to schema format.
 *
 * @example x => x
 * @example x => x?.map(y => toJson_Foo(y))
 */
export type ToJson = (expression: string) => string;
