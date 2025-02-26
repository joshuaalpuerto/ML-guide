import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  // Specifies the entry point of your bundle
  input: 'src/shared/extractor/index.ts',
  output: {
    // Where to save the bundled file
    file: 'dist/extractor.umd.js',

    // UMD format makes it work in Node.js, AMD, and as a global variable in browsers
    format: 'umd',

    // The name of the global variable when used in browser
    // Will be accessible as window.Extractor
    name: 'Extractor',

    // Generates a source map for debugging - optional but recommended
    sourcemap: false
  },
  plugins: [
      // Helps Rollup find and include installed modules from node_modules
      resolve({
        // Prefer browser-specific versions of modules if available
        browser: true,  // Optional - only needed if you have browser-specific dependencies
  
        // File extensions to check when resolving modules
        extensions: ['.js', '.ts']  // Needed since you're using TypeScript
      }),
  
      // Converts CommonJS modules to ES6 so Rollup can process them
      commonjs(),  // Needed if you have dependencies using CommonJS format
  
      // Handles TypeScript compilation
      typescript() // Needed since you're using TypeScript
  ]
};