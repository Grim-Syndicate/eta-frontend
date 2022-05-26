class Utils{
    static renderBigNumber = (num:number, options = { maximumFractionDigits: 2 }) => {
        return num ? num.toLocaleString(undefined, options) : 0
    }
    
    static renderSOL = (num:number, symbol = 'SOL') => {
        return num != null && num != undefined && num != NaN ? `${Utils.renderBigNumber(num, { maximumFractionDigits: 3 })} ${symbol}` : '-'
    }
    
    static renderPercentage = (num:number) => {
        return num != null && num != undefined && num != NaN ? `${Utils.renderBigNumber(num, { maximumFractionDigits: 2 })}%` : '-'
    }

    static Timer = (ms:number) => {
        let id:NodeJS.Timeout | undefined;
    
        const start = () => new Promise(resolve => {
            if (id === undefined) {
                throw new Error('Timer already aborted');
            }
    
            id = setTimeout(resolve, ms);
        });
    
        const abort = () => {
            if (id === undefined) {
                clearTimeout(id);
                id = undefined;
            }
        }
    
        return {
            start, abort
        }
    };
    
    static formatPoints = (points:string) => {
      let p = parseFloat(points);
      return p >= 100 ? p.toFixed(2) : p.toFixed(3);
    };

    // Clamp number between two values with the following line:
    static clamp = (num:number, min:number, max:number) => Math.min(Math.max(num, min), max);
}

export default Utils;