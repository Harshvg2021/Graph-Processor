const DATA_TYPES = {
    INT: 'int',
    FLOAT: 'float',
    STRING: 'str',
    BOOLEAN: 'bool',
    LIST: 'list',
    DICT: 'dict'
};

class DataTypeUtils {
    static getType(value) {
        if (Number.isInteger(value)) return DATA_TYPES.INT;
        if (typeof value === 'number') return DATA_TYPES.FLOAT;
        if (typeof value === 'string') return DATA_TYPES.STRING;
        if (typeof value === 'boolean') return DATA_TYPES.BOOLEAN;
        if (Array.isArray(value)) return DATA_TYPES.LIST;
        if (value && typeof value === 'object') return DATA_TYPES.DICT;
        throw new Error(`Unsupported data type for value: ${value}`);
    }

    static validateType(value, expectedType) {
        if (!expectedType) return true;

        const actualType = this.getType(value);
        
        if (actualType === expectedType) return true;

        if (expectedType === DATA_TYPES.FLOAT && actualType === DATA_TYPES.INT) {
            return true;
        }

        return false;
    }

    static validateCompatibility(sourceValue, destValue) {
        if (Array.isArray(sourceValue) && Array.isArray(destValue)) {
            return this.validateListCompatibility(sourceValue, destValue);
        }

        const sourceType = this.getType(sourceValue);
        const destType = this.getType(destValue);

        if (sourceType === destType) return true;

        if ((sourceType === DATA_TYPES.INT && destType === DATA_TYPES.FLOAT) ||
            (sourceType === DATA_TYPES.FLOAT && destType === DATA_TYPES.INT)) {
            return true;
        }

        if (sourceType === DATA_TYPES.DICT && destType === DATA_TYPES.DICT) {
            return this.validateDictCompatibility(sourceValue, destValue);
        }

        return false;
    }

    static validateListCompatibility(sourceList, destList) {
        if (sourceList.length === 0 || destList.length === 0) return true;

        const sourceFirstType = this.getType(sourceList[0]);
        const destFirstType = this.getType(destList[0]);

        const sourceUniform = sourceList.every(item => this.getType(item) === sourceFirstType);
        const destUniform = destList.every(item => this.getType(item) === destFirstType);

        if (!sourceUniform || !destUniform) {
            return false;
        }

        if (sourceFirstType === destFirstType) {
            return true;
        }

        if ((sourceFirstType === DATA_TYPES.INT && destFirstType === DATA_TYPES.FLOAT) ||
            (sourceFirstType === DATA_TYPES.FLOAT && destFirstType === DATA_TYPES.INT)) {
            return true;
        }

        return false;
    }

    static validateDictCompatibility(sourceDict, destDict) {
        if (Object.keys(sourceDict).length === 0 || Object.keys(destDict).length === 0) return true;

        const allKeys = new Set([...Object.keys(sourceDict), ...Object.keys(destDict)]);

        for (const key of allKeys) {
            const sourceValue = sourceDict[key];
            const destValue = destDict[key];

            if (sourceValue !== undefined && destValue !== undefined) {
                if (!this.validateCompatibility(sourceValue, destValue)) {
                    return false;
                }
            }
        }
        return true;
    }

    static isPrimitive(value) {
        const type = this.getType(value);
        return [DATA_TYPES.INT, DATA_TYPES.FLOAT, DATA_TYPES.STRING, DATA_TYPES.BOOLEAN].includes(type);
    }
}

module.exports = { DataTypeUtils, DATA_TYPES };