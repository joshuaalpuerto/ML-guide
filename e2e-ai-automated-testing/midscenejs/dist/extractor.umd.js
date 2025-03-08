(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Extractor = {}));
})(this, (function (exports) { 'use strict';

    function truncateText(text, maxLength = 150) {
        if (typeof text === 'undefined') {
            return '';
        }
        if (typeof text === 'object') {
            text = JSON.stringify(text);
        }
        if (typeof text === 'number') {
            return text.toString();
        }
        if (typeof text === 'string' && text.length > maxLength) {
            return `${text.slice(0, maxLength)}...`;
        }
        if (typeof text === 'string') {
            return text.trim();
        }
        return '';
    }
    function trimAttributes(attributes, truncateTextLength) {
        const tailorAttributes = Object.keys(attributes).reduce((res, currentKey) => {
            const attributeVal = attributes[currentKey];
            if (currentKey === 'style' ||
                currentKey === 'src' ||
                currentKey === 'htmlTagName' ||
                currentKey === 'nodeType') {
                return res;
            }
            res[currentKey] = truncateText(attributeVal, truncateTextLength);
            return res;
        }, {});
        return tailorAttributes;
    }
    const nodeSizeThreshold = 4;
    function descriptionOfTree(tree, truncateTextLength, filterNonTextContent = false) {
        const attributesString = (kv) => {
            return Object.entries(kv)
                .map(([key, value]) => `${key}="${truncateText(value, truncateTextLength)}"`)
                .join(' ');
        };
        function buildContentTree(node) {
            var _a;
            let before = '';
            let htmlContent = '';
            let after = '';
            let emptyNode = true;
            let children = '';
            for (let i = 0; i < (node.children || []).length; i++) {
                const childContent = buildContentTree(node.children[i]);
                if (childContent) {
                    children += `${childContent}`;
                }
            }
            if (node.node &&
                node.node.rect.width > nodeSizeThreshold &&
                node.node.rect.height > nodeSizeThreshold &&
                (!filterNonTextContent || (filterNonTextContent && node.node.content))) {
                emptyNode = false;
                let nodeTypeString;
                if ((_a = node.node.attributes) === null || _a === void 0 ? void 0 : _a.htmlTagName) {
                    nodeTypeString = node.node.attributes.htmlTagName.replace(/[<>]/g, '');
                }
                else {
                    nodeTypeString = node.node.attributes.nodeType
                        .replace(/\sNode$/, '')
                        .toLowerCase();
                }
                const markerId = node.node.indexId;
                const markerIdString = markerId ? `markerId="${markerId}"` : '';
                const rectAttribute = node.node.rect
                    ? {
                        left: node.node.rect.left,
                        top: node.node.rect.top,
                        width: node.node.rect.width,
                        height: node.node.rect.height,
                    }
                    : {};
                before = `<${nodeTypeString} id="${node.node.id}" ${markerIdString} ${attributesString(trimAttributes(node.node.attributes || {}, truncateTextLength))} ${attributesString(rectAttribute)}>`;
                const content = truncateText(node.node.content, truncateTextLength);
                htmlContent = content ? `${content}` : '';
                after = `</${nodeTypeString}>`;
            }
            else if (!filterNonTextContent) {
                if (!children.trim().startsWith('<>')) {
                    before = '<>';
                    htmlContent = '';
                    after = '</>';
                }
            }
            if (emptyNode && !children.trim()) {
                return '';
            }
            const result = `${before}${htmlContent}${children}${after}`;
            if (result.trim()) {
                return result;
            }
            return '';
        }
        const result = buildContentTree(tree);
        return result.replace(/^\s*\n/gm, '');
    }
    function treeToList(tree) {
        const result = [];
        function dfs(node) {
            if (node.node) {
                result.push(node.node);
            }
            for (const child of node.children) {
                dfs(child);
            }
        }
        dfs(tree);
        return result;
    }
    function traverseTree(tree, onNode) {
        function dfs(node) {
            if (node.node) {
                node.node = onNode(node.node);
            }
            for (const child of node.children) {
                dfs(child);
            }
        }
        dfs(tree);
        return tree;
    }

    const CONTAINER_MINI_HEIGHT = 3;
    const CONTAINER_MINI_WIDTH = 3;
    var NodeType;
    (function (NodeType) {
        NodeType["CONTAINER"] = "CONTAINER Node";
        NodeType["FORM_ITEM"] = "FORM_ITEM Node";
        NodeType["BUTTON"] = "BUTTON Node";
        NodeType["IMG"] = "IMG Node";
        NodeType["TEXT"] = "TEXT Node";
        NodeType["POSITION"] = "POSITION Node";
    })(NodeType || (NodeType = {}));

    function isFormElement(node) {
        if (!(node instanceof HTMLElement))
            return false;
        // Check for standard form elements
        const isStandardForm = node.tagName.toLowerCase() === 'input' ||
            node.tagName.toLowerCase() === 'textarea' ||
            node.tagName.toLowerCase() === 'select' ||
            node.tagName.toLowerCase() === 'option';
        // Check for custom editor elements
        const isCustomEditor = node.tagName.toLowerCase() === 'trix-editor' || // Trix editor
            (node.getAttribute('contenteditable') === 'true' && node.getAttribute('role') === 'textbox'); // Generic contenteditable elements with textbox role
        return isStandardForm || isCustomEditor;
    }
    function isButtonElement(node) {
        return node instanceof HTMLElement && node.tagName.toLowerCase() === 'button';
    }
    function isImgElement(node) {
        // check if the node is an image element
        if (!includeBaseElement(node) && node instanceof Element) {
            const computedStyle = window.getComputedStyle(node);
            const backgroundImage = computedStyle.getPropertyValue('background-image');
            if (backgroundImage !== 'none') {
                return true;
            }
        }
        if (isIconfont(node)) {
            return true;
        }
        return ((node instanceof HTMLElement && node.tagName.toLowerCase() === 'img') ||
            (node instanceof SVGElement && node.tagName.toLowerCase() === 'svg'));
    }
    function isIconfont(node) {
        if (node instanceof Element) {
            const computedStyle = window.getComputedStyle(node);
            const fontFamilyValue = computedStyle.fontFamily || '';
            return fontFamilyValue.toLowerCase().indexOf('iconfont') >= 0;
        }
        return false;
    }
    function isTextElement(node) {
        return node.nodeName.toLowerCase() === '#text' && !isIconfont(node);
    }
    function isContainerElement(node) {
        if (!(node instanceof HTMLElement))
            return false;
        // include other base elements
        if (includeBaseElement(node)) {
            return false;
        }
        const computedStyle = window.getComputedStyle(node);
        const backgroundColor = computedStyle.getPropertyValue('background-color');
        if (backgroundColor) {
            return true;
        }
        return false;
    }
    function includeBaseElement(node) {
        if (!(node instanceof HTMLElement))
            return false;
        // include text
        if (node.innerText) {
            return true;
        }
        const includeList = [
            'svg',
            'button',
            'input',
            'textarea',
            'select',
            'option',
            'img',
        ];
        for (const tagName of includeList) {
            const element = node.querySelectorAll(tagName);
            if (element.length > 0) {
                return true;
            }
        }
        return false;
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getAugmentedNamespace(n) {
      if (n.__esModule) return n;
      var f = n.default;
    	if (typeof f == "function") {
    		var a = function a () {
    			if (this instanceof a) {
            return Reflect.construct(f, arguments, this.constructor);
    			}
    			return f.apply(this, arguments);
    		};
    		a.prototype = f.prototype;
      } else a = {};
      Object.defineProperty(a, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    var sha256 = {exports: {}};

    var _nodeResolve_empty = {};

    var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        default: _nodeResolve_empty
    });

    var require$$1 = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

    /**
     * [js-sha256]{@link https://github.com/emn178/js-sha256}
     *
     * @version 0.11.0
     * @author Chen, Yi-Cyuan [emn178@gmail.com]
     * @copyright Chen, Yi-Cyuan 2014-2024
     * @license MIT
     */

    var hasRequiredSha256;

    function requireSha256 () {
    	if (hasRequiredSha256) return sha256.exports;
    	hasRequiredSha256 = 1;
    	(function (module) {
    		/*jslint bitwise: true */
    		(function () {

    		  var ERROR = 'input is invalid type';
    		  var WINDOW = typeof window === 'object';
    		  var root = WINDOW ? window : {};
    		  if (root.JS_SHA256_NO_WINDOW) {
    		    WINDOW = false;
    		  }
    		  var WEB_WORKER = !WINDOW && typeof self === 'object';
    		  var NODE_JS = !root.JS_SHA256_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
    		  if (NODE_JS) {
    		    root = commonjsGlobal;
    		  } else if (WEB_WORKER) {
    		    root = self;
    		  }
    		  var COMMON_JS = !root.JS_SHA256_NO_COMMON_JS && 'object' === 'object' && module.exports;
    		  var ARRAY_BUFFER = !root.JS_SHA256_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
    		  var HEX_CHARS = '0123456789abcdef'.split('');
    		  var EXTRA = [-2147483648, 8388608, 32768, 128];
    		  var SHIFT = [24, 16, 8, 0];
    		  var K = [
    		    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    		    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    		    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    		    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    		    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    		    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    		    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    		    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    		  ];
    		  var OUTPUT_TYPES = ['hex', 'array', 'digest', 'arrayBuffer'];

    		  var blocks = [];

    		  if (root.JS_SHA256_NO_NODE_JS || !Array.isArray) {
    		    Array.isArray = function (obj) {
    		      return Object.prototype.toString.call(obj) === '[object Array]';
    		    };
    		  }

    		  if (ARRAY_BUFFER && (root.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
    		    ArrayBuffer.isView = function (obj) {
    		      return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
    		    };
    		  }

    		  var createOutputMethod = function (outputType, is224) {
    		    return function (message) {
    		      return new Sha256(is224, true).update(message)[outputType]();
    		    };
    		  };

    		  var createMethod = function (is224) {
    		    var method = createOutputMethod('hex', is224);
    		    if (NODE_JS) {
    		      method = nodeWrap(method, is224);
    		    }
    		    method.create = function () {
    		      return new Sha256(is224);
    		    };
    		    method.update = function (message) {
    		      return method.create().update(message);
    		    };
    		    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
    		      var type = OUTPUT_TYPES[i];
    		      method[type] = createOutputMethod(type, is224);
    		    }
    		    return method;
    		  };

    		  var nodeWrap = function (method, is224) {
    		    var crypto = require$$1;
    		    var Buffer = require$$1.Buffer;
    		    var algorithm = is224 ? 'sha224' : 'sha256';
    		    var bufferFrom;
    		    if (Buffer.from && !root.JS_SHA256_NO_BUFFER_FROM) {
    		      bufferFrom = Buffer.from;
    		    } else {
    		      bufferFrom = function (message) {
    		        return new Buffer(message);
    		      };
    		    }
    		    var nodeMethod = function (message) {
    		      if (typeof message === 'string') {
    		        return crypto.createHash(algorithm).update(message, 'utf8').digest('hex');
    		      } else {
    		        if (message === null || message === undefined) {
    		          throw new Error(ERROR);
    		        } else if (message.constructor === ArrayBuffer) {
    		          message = new Uint8Array(message);
    		        }
    		      }
    		      if (Array.isArray(message) || ArrayBuffer.isView(message) ||
    		        message.constructor === Buffer) {
    		        return crypto.createHash(algorithm).update(bufferFrom(message)).digest('hex');
    		      } else {
    		        return method(message);
    		      }
    		    };
    		    return nodeMethod;
    		  };

    		  var createHmacOutputMethod = function (outputType, is224) {
    		    return function (key, message) {
    		      return new HmacSha256(key, is224, true).update(message)[outputType]();
    		    };
    		  };

    		  var createHmacMethod = function (is224) {
    		    var method = createHmacOutputMethod('hex', is224);
    		    method.create = function (key) {
    		      return new HmacSha256(key, is224);
    		    };
    		    method.update = function (key, message) {
    		      return method.create(key).update(message);
    		    };
    		    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
    		      var type = OUTPUT_TYPES[i];
    		      method[type] = createHmacOutputMethod(type, is224);
    		    }
    		    return method;
    		  };

    		  function Sha256(is224, sharedMemory) {
    		    if (sharedMemory) {
    		      blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] =
    		        blocks[4] = blocks[5] = blocks[6] = blocks[7] =
    		        blocks[8] = blocks[9] = blocks[10] = blocks[11] =
    		        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    		      this.blocks = blocks;
    		    } else {
    		      this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    		    }

    		    if (is224) {
    		      this.h0 = 0xc1059ed8;
    		      this.h1 = 0x367cd507;
    		      this.h2 = 0x3070dd17;
    		      this.h3 = 0xf70e5939;
    		      this.h4 = 0xffc00b31;
    		      this.h5 = 0x68581511;
    		      this.h6 = 0x64f98fa7;
    		      this.h7 = 0xbefa4fa4;
    		    } else { // 256
    		      this.h0 = 0x6a09e667;
    		      this.h1 = 0xbb67ae85;
    		      this.h2 = 0x3c6ef372;
    		      this.h3 = 0xa54ff53a;
    		      this.h4 = 0x510e527f;
    		      this.h5 = 0x9b05688c;
    		      this.h6 = 0x1f83d9ab;
    		      this.h7 = 0x5be0cd19;
    		    }

    		    this.block = this.start = this.bytes = this.hBytes = 0;
    		    this.finalized = this.hashed = false;
    		    this.first = true;
    		    this.is224 = is224;
    		  }

    		  Sha256.prototype.update = function (message) {
    		    if (this.finalized) {
    		      return;
    		    }
    		    var notString, type = typeof message;
    		    if (type !== 'string') {
    		      if (type === 'object') {
    		        if (message === null) {
    		          throw new Error(ERROR);
    		        } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
    		          message = new Uint8Array(message);
    		        } else if (!Array.isArray(message)) {
    		          if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
    		            throw new Error(ERROR);
    		          }
    		        }
    		      } else {
    		        throw new Error(ERROR);
    		      }
    		      notString = true;
    		    }
    		    var code, index = 0, i, length = message.length, blocks = this.blocks;
    		    while (index < length) {
    		      if (this.hashed) {
    		        this.hashed = false;
    		        blocks[0] = this.block;
    		        this.block = blocks[16] = blocks[1] = blocks[2] = blocks[3] =
    		          blocks[4] = blocks[5] = blocks[6] = blocks[7] =
    		          blocks[8] = blocks[9] = blocks[10] = blocks[11] =
    		          blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    		      }

    		      if (notString) {
    		        for (i = this.start; index < length && i < 64; ++index) {
    		          blocks[i >>> 2] |= message[index] << SHIFT[i++ & 3];
    		        }
    		      } else {
    		        for (i = this.start; index < length && i < 64; ++index) {
    		          code = message.charCodeAt(index);
    		          if (code < 0x80) {
    		            blocks[i >>> 2] |= code << SHIFT[i++ & 3];
    		          } else if (code < 0x800) {
    		            blocks[i >>> 2] |= (0xc0 | (code >>> 6)) << SHIFT[i++ & 3];
    		            blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
    		          } else if (code < 0xd800 || code >= 0xe000) {
    		            blocks[i >>> 2] |= (0xe0 | (code >>> 12)) << SHIFT[i++ & 3];
    		            blocks[i >>> 2] |= (0x80 | ((code >>> 6) & 0x3f)) << SHIFT[i++ & 3];
    		            blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
    		          } else {
    		            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
    		            blocks[i >>> 2] |= (0xf0 | (code >>> 18)) << SHIFT[i++ & 3];
    		            blocks[i >>> 2] |= (0x80 | ((code >>> 12) & 0x3f)) << SHIFT[i++ & 3];
    		            blocks[i >>> 2] |= (0x80 | ((code >>> 6) & 0x3f)) << SHIFT[i++ & 3];
    		            blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
    		          }
    		        }
    		      }

    		      this.lastByteIndex = i;
    		      this.bytes += i - this.start;
    		      if (i >= 64) {
    		        this.block = blocks[16];
    		        this.start = i - 64;
    		        this.hash();
    		        this.hashed = true;
    		      } else {
    		        this.start = i;
    		      }
    		    }
    		    if (this.bytes > 4294967295) {
    		      this.hBytes += this.bytes / 4294967296 << 0;
    		      this.bytes = this.bytes % 4294967296;
    		    }
    		    return this;
    		  };

    		  Sha256.prototype.finalize = function () {
    		    if (this.finalized) {
    		      return;
    		    }
    		    this.finalized = true;
    		    var blocks = this.blocks, i = this.lastByteIndex;
    		    blocks[16] = this.block;
    		    blocks[i >>> 2] |= EXTRA[i & 3];
    		    this.block = blocks[16];
    		    if (i >= 56) {
    		      if (!this.hashed) {
    		        this.hash();
    		      }
    		      blocks[0] = this.block;
    		      blocks[16] = blocks[1] = blocks[2] = blocks[3] =
    		        blocks[4] = blocks[5] = blocks[6] = blocks[7] =
    		        blocks[8] = blocks[9] = blocks[10] = blocks[11] =
    		        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    		    }
    		    blocks[14] = this.hBytes << 3 | this.bytes >>> 29;
    		    blocks[15] = this.bytes << 3;
    		    this.hash();
    		  };

    		  Sha256.prototype.hash = function () {
    		    var a = this.h0, b = this.h1, c = this.h2, d = this.h3, e = this.h4, f = this.h5, g = this.h6,
    		      h = this.h7, blocks = this.blocks, j, s0, s1, maj, t1, t2, ch, ab, da, cd, bc;

    		    for (j = 16; j < 64; ++j) {
    		      // rightrotate
    		      t1 = blocks[j - 15];
    		      s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
    		      t1 = blocks[j - 2];
    		      s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10);
    		      blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
    		    }

    		    bc = b & c;
    		    for (j = 0; j < 64; j += 4) {
    		      if (this.first) {
    		        if (this.is224) {
    		          ab = 300032;
    		          t1 = blocks[0] - 1413257819;
    		          h = t1 - 150054599 << 0;
    		          d = t1 + 24177077 << 0;
    		        } else {
    		          ab = 704751109;
    		          t1 = blocks[0] - 210244248;
    		          h = t1 - 1521486534 << 0;
    		          d = t1 + 143694565 << 0;
    		        }
    		        this.first = false;
    		      } else {
    		        s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
    		        s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
    		        ab = a & b;
    		        maj = ab ^ (a & c) ^ bc;
    		        ch = (e & f) ^ (~e & g);
    		        t1 = h + s1 + ch + K[j] + blocks[j];
    		        t2 = s0 + maj;
    		        h = d + t1 << 0;
    		        d = t1 + t2 << 0;
    		      }
    		      s0 = ((d >>> 2) | (d << 30)) ^ ((d >>> 13) | (d << 19)) ^ ((d >>> 22) | (d << 10));
    		      s1 = ((h >>> 6) | (h << 26)) ^ ((h >>> 11) | (h << 21)) ^ ((h >>> 25) | (h << 7));
    		      da = d & a;
    		      maj = da ^ (d & b) ^ ab;
    		      ch = (h & e) ^ (~h & f);
    		      t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
    		      t2 = s0 + maj;
    		      g = c + t1 << 0;
    		      c = t1 + t2 << 0;
    		      s0 = ((c >>> 2) | (c << 30)) ^ ((c >>> 13) | (c << 19)) ^ ((c >>> 22) | (c << 10));
    		      s1 = ((g >>> 6) | (g << 26)) ^ ((g >>> 11) | (g << 21)) ^ ((g >>> 25) | (g << 7));
    		      cd = c & d;
    		      maj = cd ^ (c & a) ^ da;
    		      ch = (g & h) ^ (~g & e);
    		      t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
    		      t2 = s0 + maj;
    		      f = b + t1 << 0;
    		      b = t1 + t2 << 0;
    		      s0 = ((b >>> 2) | (b << 30)) ^ ((b >>> 13) | (b << 19)) ^ ((b >>> 22) | (b << 10));
    		      s1 = ((f >>> 6) | (f << 26)) ^ ((f >>> 11) | (f << 21)) ^ ((f >>> 25) | (f << 7));
    		      bc = b & c;
    		      maj = bc ^ (b & d) ^ cd;
    		      ch = (f & g) ^ (~f & h);
    		      t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
    		      t2 = s0 + maj;
    		      e = a + t1 << 0;
    		      a = t1 + t2 << 0;
    		      this.chromeBugWorkAround = true;
    		    }

    		    this.h0 = this.h0 + a << 0;
    		    this.h1 = this.h1 + b << 0;
    		    this.h2 = this.h2 + c << 0;
    		    this.h3 = this.h3 + d << 0;
    		    this.h4 = this.h4 + e << 0;
    		    this.h5 = this.h5 + f << 0;
    		    this.h6 = this.h6 + g << 0;
    		    this.h7 = this.h7 + h << 0;
    		  };

    		  Sha256.prototype.hex = function () {
    		    this.finalize();

    		    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5,
    		      h6 = this.h6, h7 = this.h7;

    		    var hex = HEX_CHARS[(h0 >>> 28) & 0x0F] + HEX_CHARS[(h0 >>> 24) & 0x0F] +
    		      HEX_CHARS[(h0 >>> 20) & 0x0F] + HEX_CHARS[(h0 >>> 16) & 0x0F] +
    		      HEX_CHARS[(h0 >>> 12) & 0x0F] + HEX_CHARS[(h0 >>> 8) & 0x0F] +
    		      HEX_CHARS[(h0 >>> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
    		      HEX_CHARS[(h1 >>> 28) & 0x0F] + HEX_CHARS[(h1 >>> 24) & 0x0F] +
    		      HEX_CHARS[(h1 >>> 20) & 0x0F] + HEX_CHARS[(h1 >>> 16) & 0x0F] +
    		      HEX_CHARS[(h1 >>> 12) & 0x0F] + HEX_CHARS[(h1 >>> 8) & 0x0F] +
    		      HEX_CHARS[(h1 >>> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
    		      HEX_CHARS[(h2 >>> 28) & 0x0F] + HEX_CHARS[(h2 >>> 24) & 0x0F] +
    		      HEX_CHARS[(h2 >>> 20) & 0x0F] + HEX_CHARS[(h2 >>> 16) & 0x0F] +
    		      HEX_CHARS[(h2 >>> 12) & 0x0F] + HEX_CHARS[(h2 >>> 8) & 0x0F] +
    		      HEX_CHARS[(h2 >>> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
    		      HEX_CHARS[(h3 >>> 28) & 0x0F] + HEX_CHARS[(h3 >>> 24) & 0x0F] +
    		      HEX_CHARS[(h3 >>> 20) & 0x0F] + HEX_CHARS[(h3 >>> 16) & 0x0F] +
    		      HEX_CHARS[(h3 >>> 12) & 0x0F] + HEX_CHARS[(h3 >>> 8) & 0x0F] +
    		      HEX_CHARS[(h3 >>> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
    		      HEX_CHARS[(h4 >>> 28) & 0x0F] + HEX_CHARS[(h4 >>> 24) & 0x0F] +
    		      HEX_CHARS[(h4 >>> 20) & 0x0F] + HEX_CHARS[(h4 >>> 16) & 0x0F] +
    		      HEX_CHARS[(h4 >>> 12) & 0x0F] + HEX_CHARS[(h4 >>> 8) & 0x0F] +
    		      HEX_CHARS[(h4 >>> 4) & 0x0F] + HEX_CHARS[h4 & 0x0F] +
    		      HEX_CHARS[(h5 >>> 28) & 0x0F] + HEX_CHARS[(h5 >>> 24) & 0x0F] +
    		      HEX_CHARS[(h5 >>> 20) & 0x0F] + HEX_CHARS[(h5 >>> 16) & 0x0F] +
    		      HEX_CHARS[(h5 >>> 12) & 0x0F] + HEX_CHARS[(h5 >>> 8) & 0x0F] +
    		      HEX_CHARS[(h5 >>> 4) & 0x0F] + HEX_CHARS[h5 & 0x0F] +
    		      HEX_CHARS[(h6 >>> 28) & 0x0F] + HEX_CHARS[(h6 >>> 24) & 0x0F] +
    		      HEX_CHARS[(h6 >>> 20) & 0x0F] + HEX_CHARS[(h6 >>> 16) & 0x0F] +
    		      HEX_CHARS[(h6 >>> 12) & 0x0F] + HEX_CHARS[(h6 >>> 8) & 0x0F] +
    		      HEX_CHARS[(h6 >>> 4) & 0x0F] + HEX_CHARS[h6 & 0x0F];
    		    if (!this.is224) {
    		      hex += HEX_CHARS[(h7 >>> 28) & 0x0F] + HEX_CHARS[(h7 >>> 24) & 0x0F] +
    		        HEX_CHARS[(h7 >>> 20) & 0x0F] + HEX_CHARS[(h7 >>> 16) & 0x0F] +
    		        HEX_CHARS[(h7 >>> 12) & 0x0F] + HEX_CHARS[(h7 >>> 8) & 0x0F] +
    		        HEX_CHARS[(h7 >>> 4) & 0x0F] + HEX_CHARS[h7 & 0x0F];
    		    }
    		    return hex;
    		  };

    		  Sha256.prototype.toString = Sha256.prototype.hex;

    		  Sha256.prototype.digest = function () {
    		    this.finalize();

    		    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5,
    		      h6 = this.h6, h7 = this.h7;

    		    var arr = [
    		      (h0 >>> 24) & 0xFF, (h0 >>> 16) & 0xFF, (h0 >>> 8) & 0xFF, h0 & 0xFF,
    		      (h1 >>> 24) & 0xFF, (h1 >>> 16) & 0xFF, (h1 >>> 8) & 0xFF, h1 & 0xFF,
    		      (h2 >>> 24) & 0xFF, (h2 >>> 16) & 0xFF, (h2 >>> 8) & 0xFF, h2 & 0xFF,
    		      (h3 >>> 24) & 0xFF, (h3 >>> 16) & 0xFF, (h3 >>> 8) & 0xFF, h3 & 0xFF,
    		      (h4 >>> 24) & 0xFF, (h4 >>> 16) & 0xFF, (h4 >>> 8) & 0xFF, h4 & 0xFF,
    		      (h5 >>> 24) & 0xFF, (h5 >>> 16) & 0xFF, (h5 >>> 8) & 0xFF, h5 & 0xFF,
    		      (h6 >>> 24) & 0xFF, (h6 >>> 16) & 0xFF, (h6 >>> 8) & 0xFF, h6 & 0xFF
    		    ];
    		    if (!this.is224) {
    		      arr.push((h7 >>> 24) & 0xFF, (h7 >>> 16) & 0xFF, (h7 >>> 8) & 0xFF, h7 & 0xFF);
    		    }
    		    return arr;
    		  };

    		  Sha256.prototype.array = Sha256.prototype.digest;

    		  Sha256.prototype.arrayBuffer = function () {
    		    this.finalize();

    		    var buffer = new ArrayBuffer(this.is224 ? 28 : 32);
    		    var dataView = new DataView(buffer);
    		    dataView.setUint32(0, this.h0);
    		    dataView.setUint32(4, this.h1);
    		    dataView.setUint32(8, this.h2);
    		    dataView.setUint32(12, this.h3);
    		    dataView.setUint32(16, this.h4);
    		    dataView.setUint32(20, this.h5);
    		    dataView.setUint32(24, this.h6);
    		    if (!this.is224) {
    		      dataView.setUint32(28, this.h7);
    		    }
    		    return buffer;
    		  };

    		  function HmacSha256(key, is224, sharedMemory) {
    		    var i, type = typeof key;
    		    if (type === 'string') {
    		      var bytes = [], length = key.length, index = 0, code;
    		      for (i = 0; i < length; ++i) {
    		        code = key.charCodeAt(i);
    		        if (code < 0x80) {
    		          bytes[index++] = code;
    		        } else if (code < 0x800) {
    		          bytes[index++] = (0xc0 | (code >>> 6));
    		          bytes[index++] = (0x80 | (code & 0x3f));
    		        } else if (code < 0xd800 || code >= 0xe000) {
    		          bytes[index++] = (0xe0 | (code >>> 12));
    		          bytes[index++] = (0x80 | ((code >>> 6) & 0x3f));
    		          bytes[index++] = (0x80 | (code & 0x3f));
    		        } else {
    		          code = 0x10000 + (((code & 0x3ff) << 10) | (key.charCodeAt(++i) & 0x3ff));
    		          bytes[index++] = (0xf0 | (code >>> 18));
    		          bytes[index++] = (0x80 | ((code >>> 12) & 0x3f));
    		          bytes[index++] = (0x80 | ((code >>> 6) & 0x3f));
    		          bytes[index++] = (0x80 | (code & 0x3f));
    		        }
    		      }
    		      key = bytes;
    		    } else {
    		      if (type === 'object') {
    		        if (key === null) {
    		          throw new Error(ERROR);
    		        } else if (ARRAY_BUFFER && key.constructor === ArrayBuffer) {
    		          key = new Uint8Array(key);
    		        } else if (!Array.isArray(key)) {
    		          if (!ARRAY_BUFFER || !ArrayBuffer.isView(key)) {
    		            throw new Error(ERROR);
    		          }
    		        }
    		      } else {
    		        throw new Error(ERROR);
    		      }
    		    }

    		    if (key.length > 64) {
    		      key = (new Sha256(is224, true)).update(key).array();
    		    }

    		    var oKeyPad = [], iKeyPad = [];
    		    for (i = 0; i < 64; ++i) {
    		      var b = key[i] || 0;
    		      oKeyPad[i] = 0x5c ^ b;
    		      iKeyPad[i] = 0x36 ^ b;
    		    }

    		    Sha256.call(this, is224, sharedMemory);

    		    this.update(iKeyPad);
    		    this.oKeyPad = oKeyPad;
    		    this.inner = true;
    		    this.sharedMemory = sharedMemory;
    		  }
    		  HmacSha256.prototype = new Sha256();

    		  HmacSha256.prototype.finalize = function () {
    		    Sha256.prototype.finalize.call(this);
    		    if (this.inner) {
    		      this.inner = false;
    		      var innerHash = this.array();
    		      Sha256.call(this, this.is224, this.sharedMemory);
    		      this.update(this.oKeyPad);
    		      this.update(innerHash);
    		      Sha256.prototype.finalize.call(this);
    		    }
    		  };

    		  var exports = createMethod();
    		  exports.sha256 = exports;
    		  exports.sha224 = createMethod(true);
    		  exports.sha256.hmac = createHmacMethod();
    		  exports.sha224.hmac = createHmacMethod(true);

    		  if (COMMON_JS) {
    		    module.exports = exports;
    		  } else {
    		    root.sha256 = exports.sha256;
    		    root.sha224 = exports.sha224;
    		  }
    		})(); 
    	} (sha256));
    	return sha256.exports;
    }

    var sha256Exports = requireSha256();

    const hashMap = {}; // id - combined
    function generateHashId(rect, content = '') {
        // Combine the input into a string
        const combined = JSON.stringify({
            content,
            rect,
        });
        // Generates the sha-256 hash value and converts to a-z chars
        let sliceLength = 5;
        let slicedHash = '';
        const hashHex = sha256Exports.sha256.create().update(combined).hex();
        // Convert hex to a-z by mapping each hex char to a letter
        const toLetters = (hex) => {
            return hex
                .split('')
                .map((char) => {
                const code = Number.parseInt(char, 16);
                return String.fromCharCode(97 + (code % 26)); // 97 is 'a' in ASCII
            })
                .join('');
        };
        const hashLetters = toLetters(hashHex);
        while (sliceLength < hashLetters.length - 1) {
            slicedHash = hashLetters.slice(0, sliceLength);
            if (hashMap[slicedHash] && hashMap[slicedHash] !== combined) {
                sliceLength++;
                continue;
            }
            hashMap[slicedHash] = combined;
            break;
        }
        return slicedHash;
    }

    // import { TEXT_MAX_SIZE } from './constants';
    const MAX_VALUE_LENGTH = 300;
    let debugMode = false;
    function setDebugMode(mode) {
        debugMode = mode;
    }
    function getDebugMode() {
        return debugMode;
    }
    function logger(..._msg) {
        if (!debugMode) {
            return;
        }
        console.log(..._msg);
    }
    // const nodeIndexCounter = 0;
    const taskIdKey = '_midscene_retrieve_task_id';
    // const nodeDataIdKey = 'data-midscene-task-';
    // const nodeIndexKey = '_midscene_retrieve_node_index';
    function selectorForValue(val) {
        return `[${taskIdKey}='${val}']`;
    }
    function setDataForNode(node, nodeHash, setToParentNode, // should be false for default
    currentWindow) {
        if (!(node instanceof currentWindow.HTMLElement)) {
            return '';
        }
        const selector = selectorForValue(nodeHash);
        if (getDebugMode()) {
            if (setToParentNode) {
                if (node.parentNode instanceof currentWindow.HTMLElement) {
                    node.parentNode.setAttribute(taskIdKey, nodeHash.toString());
                }
            }
            else {
                node.setAttribute(taskIdKey, nodeHash.toString());
            }
        }
        return selector;
    }
    function getPseudoElementContent(element, currentWindow) {
        if (!(element instanceof currentWindow.HTMLElement)) {
            return { before: '', after: '' };
        }
        const beforeContent = currentWindow
            .getComputedStyle(element, '::before')
            .getPropertyValue('content');
        const afterContent = currentWindow
            .getComputedStyle(element, '::after')
            .getPropertyValue('content');
        return {
            before: beforeContent === 'none' ? '' : beforeContent.replace(/"/g, ''),
            after: afterContent === 'none' ? '' : afterContent.replace(/"/g, ''),
        };
    }
    // tell if two rects are overlapped, return the overlapped rect. If not, return null
    function overlappedRect(rect1, rect2) {
        const left = Math.max(rect1.left, rect2.left);
        const top = Math.max(rect1.top, rect2.top);
        const right = Math.min(rect1.right, rect2.right);
        const bottom = Math.min(rect1.bottom, rect2.bottom);
        if (left < right && top < bottom) {
            return {
                left,
                top,
                right,
                bottom,
                width: right - left,
                height: bottom - top,
                x: left,
                y: top,
                zoom: 1,
            };
        }
        return null;
    }
    function getRect$1(el, baseZoom, // base zoom
    currentWindow) {
        let originalRect;
        let newZoom = 1;
        if (!(el instanceof currentWindow.HTMLElement)) {
            const range = currentWindow.document.createRange();
            range.selectNodeContents(el);
            originalRect = range.getBoundingClientRect();
        }
        else {
            originalRect = el.getBoundingClientRect();
            // from Chrome v128, the API would return differently https://docs.google.com/document/d/1AcnDShjT-kEuRaMchZPm5uaIgNZ4OiYtM4JI9qiV8Po/edit
            if (!('currentCSSZoom' in el)) {
                newZoom =
                    Number.parseFloat(currentWindow.getComputedStyle(el).zoom) ||
                        1;
            }
        }
        const zoom = newZoom * baseZoom;
        return {
            width: originalRect.width * zoom,
            height: originalRect.height * zoom,
            left: originalRect.left * zoom,
            top: originalRect.top * zoom,
            right: originalRect.right * zoom,
            bottom: originalRect.bottom * zoom,
            x: originalRect.x * zoom,
            y: originalRect.y * zoom,
            zoom,
        };
    }
    const isElementCovered = (el, rect, currentWindow) => {
        // Gets the center coordinates of the element
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        // Gets the element above that point
        const topElement = currentWindow.document.elementFromPoint(x, y);
        if (!topElement) {
            return false; // usually because it's outside the screen
        }
        if (topElement === el) {
            return false;
        }
        if (el === null || el === void 0 ? void 0 : el.contains(topElement)) {
            return false;
        }
        if (topElement === null || topElement === void 0 ? void 0 : topElement.contains(el)) {
            return false;
        }
        const rectOfTopElement = getRect$1(topElement, 1, currentWindow);
        // get the remaining area of the base element
        const overlapRect = overlappedRect(rect, rectOfTopElement);
        if (!overlapRect) {
            return false;
        }
        // Todo: we should modify the 'box-select' as well to make the indicator more accurate
        // const remainingArea =
        //   rect.width * rect.height - overlapRect.width * overlapRect.height;
        // if (remainingArea > 100) {
        //   return false;
        // }
        logger(el, 'Element is covered by another element', {
            topElement,
            el,
            rect,
            x,
            y,
        });
        return true;
        // Determines if the returned element is the target element itself
        // return el.contains(topElement) || (topElement as HTMLElement).contains(el);
        // return topElement !== el && !el.contains(topElement);
    };
    function visibleRect(el, currentWindow, currentDocument, baseZoom = 1) {
        if (!el) {
            logger(el, 'Element is not in the DOM hierarchy');
            return false;
        }
        if (!(el instanceof currentWindow.HTMLElement) &&
            el.nodeType !== Node.TEXT_NODE &&
            el.nodeName.toLowerCase() !== 'svg') {
            logger(el, 'Element is not in the DOM hierarchy');
            return false;
        }
        if (el instanceof currentWindow.HTMLElement) {
            const style = currentWindow.getComputedStyle(el);
            if (style.display === 'none' ||
                style.visibility === 'hidden' ||
                (style.opacity === '0' && el.tagName !== 'INPUT')) {
                logger(el, 'Element is hidden');
                return false;
            }
        }
        const rect = getRect$1(el, baseZoom, currentWindow);
        if (rect.width === 0 && rect.height === 0) {
            logger(el, 'Element has no size');
            return false;
        }
        // check if the element is covered by another element
        // if the element is zoomed, the coverage check should be done with the original zoom
        if (baseZoom === 1 && isElementCovered(el, rect, currentWindow)) {
            logger('isElementCovered', el, rect);
            return false;
        }
        // check if the element is hidden by an ancestor
        let parent = el;
        const parentUntilNonStatic = (currentNode) => {
            // find a parent element that is not static
            let parent = currentNode === null || currentNode === void 0 ? void 0 : currentNode.parentElement;
            while (parent) {
                const style = currentWindow.getComputedStyle(parent);
                if (style.position !== 'static') {
                    return parent;
                }
                parent = parent.parentElement;
            }
            return null;
        };
        while (parent && parent !== currentDocument.body) {
            if (!(parent instanceof currentWindow.HTMLElement)) {
                parent = parent.parentElement;
                continue;
            }
            const parentStyle = currentWindow.getComputedStyle(parent);
            if (parentStyle.overflow === 'hidden') {
                const parentRect = getRect$1(parent, 1, currentWindow);
                const tolerance = 10;
                if (rect.right < parentRect.left - tolerance ||
                    rect.left > parentRect.right + tolerance ||
                    rect.bottom < parentRect.top - tolerance ||
                    rect.top > parentRect.bottom + tolerance) {
                    logger(el, 'element is partially or totally hidden by an ancestor', {
                        rect,
                        parentRect,
                    });
                    return false;
                }
            }
            // if the parent is a fixed element, stop the search
            if (parentStyle.position === 'fixed' || parentStyle.position === 'sticky') {
                break;
            }
            if (parentStyle.position === 'absolute') {
                parent = parentUntilNonStatic(parent);
            }
            else {
                parent = parent.parentElement;
            }
        }
        return {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            zoom: rect.zoom,
        };
    }
    function getNodeAttributes$1(node, currentWindow) {
        if (!node ||
            !(node instanceof currentWindow.HTMLElement) ||
            !node.attributes) {
            return {};
        }
        const attributesList = Array.from(node.attributes).map((attr) => {
            if (attr.name === 'class') {
                return [attr.name, `.${attr.value.split(' ').join('.')}`];
            }
            if (!attr.value) {
                return [];
            }
            let value = attr.value;
            if (value.startsWith('data:image')) {
                value = 'image';
            }
            if (value.length > MAX_VALUE_LENGTH) {
                value = `${value.slice(0, MAX_VALUE_LENGTH)}...`;
            }
            return [attr.name, value];
        });
        return Object.fromEntries(attributesList);
    }
    let nodeHashCacheList = [];
    if (typeof window !== 'undefined') {
        window.midsceneNodeHashCacheList =
            window.midsceneNodeHashCacheList || [];
        nodeHashCacheList = window.midsceneNodeHashCacheList;
    }
    // for each run, reset the cache list
    function resetNodeHashCacheList() {
        if (typeof window !== 'undefined') {
            nodeHashCacheList = window.midsceneNodeHashCacheList || [];
            window.midsceneNodeHashCacheList = [];
        }
        else {
            nodeHashCacheList = [];
        }
    }
    function midsceneGenerateHash(node, content, rect) {
        var _a;
        if (node && nodeHashCacheList.find((item) => item.node === node)) {
            return ((_a = nodeHashCacheList.find((item) => item.node === node)) === null || _a === void 0 ? void 0 : _a.id) || '';
        }
        const slicedHash = generateHashId(rect, content);
        if (node && typeof window !== 'undefined') {
            window.midsceneNodeHashCacheList.push({ node, id: slicedHash });
        }
        // Returns the first 10 characters as a short hash
        return slicedHash;
    }
    function getTopDocument() {
        const container = document.body || document;
        return container;
    }

    let indexId = 0;
    function tagNameOfNode(node) {
        let tagName = '';
        if (node instanceof HTMLElement) {
            tagName = node.tagName.toLowerCase();
        }
        const parentElement = node.parentElement;
        if (parentElement && parentElement instanceof HTMLElement) {
            tagName = parentElement.tagName.toLowerCase();
        }
        return tagName ? `<${tagName}>` : '';
    }
    function collectElementInfo(node, currentWindow, currentDocument, baseZoom = 1, basePoint = { left: 0, top: 0 }) {
        var _a;
        const rect = visibleRect(node, currentWindow, currentDocument, baseZoom);
        if (!rect ||
            rect.width < CONTAINER_MINI_WIDTH ||
            rect.height < CONTAINER_MINI_HEIGHT) {
            return null;
        }
        if (basePoint.left !== 0 || basePoint.top !== 0) {
            rect.left += basePoint.left;
            rect.top += basePoint.top;
        }
        // Skip elements that cover the entire viewport, as they are likely background containers
        // rather than meaningful interactive elements
        if (rect.height >= window.innerHeight && rect.width >= window.innerWidth) {
            return null;
        }
        if (isFormElement(node)) {
            const attributes = getNodeAttributes$1(node, currentWindow);
            let valueContent = attributes.value || attributes.placeholder || node.textContent || '';
            const nodeHashId = midsceneGenerateHash(node, valueContent, rect);
            const selector = setDataForNode(node, nodeHashId, false, currentWindow);
            const tagName = node.tagName.toLowerCase();
            // Handle different types of form elements
            if (tagName === 'select') {
                // Get the selected option using the selectedIndex property
                const selectedOption = node.options[node.selectedIndex];
                // Retrieve the text content of the selected option
                valueContent = selectedOption.textContent || '';
            }
            else if ((tagName === 'input' || tagName === 'textarea') &&
                node.value) {
                valueContent = node.value;
            }
            else if (tagName === 'trix-editor' || node.getAttribute('contenteditable') === 'true') {
                // Handle Trix editor and contenteditable elements
                valueContent = node.innerHTML || node.textContent || '';
            }
            const elementInfo = {
                id: nodeHashId,
                nodeHashId,
                locator: selector,
                nodeType: NodeType.FORM_ITEM,
                indexId: indexId++,
                attributes: {
                    ...attributes,
                    htmlTagName: `<${tagName}>`,
                    nodeType: NodeType.FORM_ITEM,
                },
                content: valueContent.trim(),
                rect,
                center: [
                    Math.round(rect.left + rect.width / 2),
                    Math.round(rect.top + rect.height / 2),
                ],
                zoom: rect.zoom,
                screenWidth: currentWindow.innerWidth,
                screenHeight: currentWindow.innerHeight,
            };
            return elementInfo;
        }
        if (isButtonElement(node)) {
            const attributes = getNodeAttributes$1(node, currentWindow);
            const pseudo = getPseudoElementContent(node, currentWindow);
            const content = node.innerText || pseudo.before || pseudo.after || '';
            const nodeHashId = midsceneGenerateHash(node, content, rect);
            const selector = setDataForNode(node, nodeHashId, false, currentWindow);
            const elementInfo = {
                id: nodeHashId,
                indexId: indexId++,
                nodeHashId,
                nodeType: NodeType.BUTTON,
                locator: selector,
                attributes: {
                    ...attributes,
                    htmlTagName: tagNameOfNode(node),
                    nodeType: NodeType.BUTTON,
                },
                content,
                rect,
                center: [
                    Math.round(rect.left + rect.width / 2),
                    Math.round(rect.top + rect.height / 2),
                ],
                zoom: rect.zoom,
                screenWidth: currentWindow.innerWidth,
                screenHeight: currentWindow.innerHeight,
            };
            return elementInfo;
        }
        if (isImgElement(node)) {
            const attributes = getNodeAttributes$1(node, currentWindow);
            const nodeHashId = midsceneGenerateHash(node, '', rect);
            const selector = setDataForNode(node, nodeHashId, false, currentWindow);
            const elementInfo = {
                id: nodeHashId,
                indexId: indexId++,
                nodeHashId,
                locator: selector,
                attributes: {
                    ...attributes,
                    ...(node.nodeName.toLowerCase() === 'svg'
                        ? {
                            svgContent: 'true',
                        }
                        : {}),
                    nodeType: NodeType.IMG,
                    htmlTagName: tagNameOfNode(node),
                },
                nodeType: NodeType.IMG,
                content: '',
                rect,
                center: [
                    Math.round(rect.left + rect.width / 2),
                    Math.round(rect.top + rect.height / 2),
                ],
                zoom: rect.zoom,
                screenWidth: currentWindow.innerWidth,
                screenHeight: currentWindow.innerHeight,
            };
            return elementInfo;
        }
        if (isTextElement(node)) {
            const text = (_a = node.textContent) === null || _a === void 0 ? void 0 : _a.trim().replace(/\n+/g, ' ');
            if (!text) {
                return null;
            }
            const attributes = getNodeAttributes$1(node, currentWindow);
            const attributeKeys = Object.keys(attributes);
            if (!text.trim() && attributeKeys.length === 0) {
                return null;
            }
            const nodeHashId = midsceneGenerateHash(node, text, rect);
            const selector = setDataForNode(node, nodeHashId, true, currentWindow);
            const elementInfo = {
                id: nodeHashId,
                indexId: indexId++,
                nodeHashId,
                nodeType: NodeType.TEXT,
                locator: selector,
                attributes: {
                    ...attributes,
                    nodeType: NodeType.TEXT,
                    htmlTagName: tagNameOfNode(node),
                },
                center: [
                    Math.round(rect.left + rect.width / 2),
                    Math.round(rect.top + rect.height / 2),
                ],
                // attributes,
                content: text,
                rect,
                zoom: rect.zoom,
                screenWidth: currentWindow.innerWidth,
                screenHeight: currentWindow.innerHeight,
            };
            return elementInfo;
        }
        // else, consider as a container
        if (isContainerElement(node)) {
            const attributes = getNodeAttributes$1(node, currentWindow);
            const nodeHashId = midsceneGenerateHash(node, '', rect);
            const selector = setDataForNode(node, nodeHashId, false, currentWindow);
            const elementInfo = {
                id: nodeHashId,
                nodeHashId,
                indexId: indexId++,
                nodeType: NodeType.CONTAINER,
                locator: selector,
                attributes: {
                    ...attributes,
                    nodeType: NodeType.CONTAINER,
                    htmlTagName: tagNameOfNode(node),
                },
                content: '',
                rect,
                center: [
                    Math.round(rect.left + rect.width / 2),
                    Math.round(rect.top + rect.height / 2),
                ],
                zoom: rect.zoom,
                screenWidth: currentWindow.innerWidth,
                screenHeight: currentWindow.innerHeight,
            };
            return elementInfo;
        }
        return null;
    }
    // @deprecated
    function extractTextWithPosition$1(initNode, debugMode = false) {
        const elementNode = extractTreeNode(initNode, debugMode);
        // dfs topChildren
        const elementInfoArray = [];
        function dfsTopChildren(node) {
            if (node.node) {
                elementInfoArray.push(node.node);
            }
            for (let i = 0; i < node.children.length; i++) {
                dfsTopChildren(node.children[i]);
            }
        }
        dfsTopChildren({ children: elementNode.children, node: elementNode.node });
        return elementInfoArray;
    }
    function extractTreeNodeAsString(initNode, debugMode = false) {
        const elementNode = extractTreeNode(initNode, debugMode);
        return descriptionOfTree(elementNode);
    }
    function extractTreeNode(initNode, debugMode = false) {
        setDebugMode(debugMode);
        resetNodeHashCacheList();
        indexId = 0;
        const topDocument = getTopDocument();
        const startNode = initNode || topDocument;
        const topChildren = [];
        function dfs(node, currentWindow, currentDocument, baseZoom = 1, basePoint = { left: 0, top: 0 }) {
            if (!node) {
                return null;
            }
            if (node.nodeType && node.nodeType === 10) {
                // Doctype node
                return null;
            }
            const elementInfo = collectElementInfo(node, currentWindow, currentDocument, baseZoom, basePoint);
            if (node instanceof currentWindow.HTMLIFrameElement) {
                if (node.contentWindow &&
                    node.contentWindow) {
                    return null;
                }
            }
            const nodeInfo = {
                node: elementInfo,
                children: [],
            };
            // console.log(elementInfo?.nodeType, elementInfo?.attributes.htmlTagName)
            // stop collecting if the node is a Button or Image
            if ((elementInfo === null || elementInfo === void 0 ? void 0 : elementInfo.nodeType) === NodeType.BUTTON ||
                (elementInfo === null || elementInfo === void 0 ? void 0 : elementInfo.nodeType) === NodeType.IMG ||
                (elementInfo === null || elementInfo === void 0 ? void 0 : elementInfo.nodeType) === NodeType.TEXT ||
                (elementInfo === null || elementInfo === void 0 ? void 0 : elementInfo.nodeType) === NodeType.FORM_ITEM ||
                (elementInfo === null || elementInfo === void 0 ? void 0 : elementInfo.nodeType) === NodeType.CONTAINER) {
                return nodeInfo;
            }
            const rect = getRect$1(node, baseZoom, currentWindow);
            for (let i = 0; i < node.childNodes.length; i++) {
                const childNodeInfo = dfs(node.childNodes[i], currentWindow, currentDocument, rect.zoom, basePoint);
                if (childNodeInfo) {
                    nodeInfo.children.push(childNodeInfo);
                }
            }
            return nodeInfo;
        }
        const rootNodeInfo = dfs(startNode, window, document, 1, {
            left: 0,
            top: 0,
        });
        if (rootNodeInfo) {
            topChildren.push(rootNodeInfo);
        }
        if (startNode === topDocument) {
            // find all the same-origin iframes
            const iframes = document.querySelectorAll('iframe');
            for (let i = 0; i < iframes.length; i++) {
                const iframe = iframes[i];
                if (iframe.contentDocument && iframe.contentWindow) {
                    const iframeInfo = collectElementInfo(iframe, window, document, 1);
                    // when the iframe is in the viewport, we need to collect its children
                    if (iframeInfo) {
                        const iframeChildren = dfs(iframe.contentDocument.body, iframe.contentWindow, iframe.contentDocument, 1, {
                            left: iframeInfo.rect.left,
                            top: iframeInfo.rect.top,
                        });
                        if (iframeChildren) {
                            topChildren.push(iframeChildren);
                        }
                    }
                }
            }
        }
        return {
            node: null,
            children: topChildren,
        };
    }

    // Retrieve attributes from a node
    function getNodeAttributes(node) {
        var _a;
        const attrs = {};
        // Check if node exists and its type is ELEMENT_NODE
        if (node && node.nodeType === 1) {
            const element = node;
            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                attrs[attr.nodeName] = (_a = attr.nodeValue) !== null && _a !== void 0 ? _a : '';
            }
        }
        return attrs;
    }
    // Retrieve rectangle information
    function getRect(attributes) {
        var _a, _b, _c, _d;
        const x = Math.round(Number.parseFloat((_a = attributes.x) !== null && _a !== void 0 ? _a : '0'));
        const y = Math.round(Number.parseFloat((_b = attributes.y) !== null && _b !== void 0 ? _b : '0'));
        const width = Math.round(Number.parseFloat((_c = attributes.width) !== null && _c !== void 0 ? _c : '0'));
        const height = Math.round(Number.parseFloat((_d = attributes.height) !== null && _d !== void 0 ? _d : '0'));
        return {
            left: Math.max(0, Math.floor(x)),
            top: Math.max(0, Math.floor(y)),
            width: Math.max(0, width),
            height: Math.max(0, height),
        };
    }
    // Validate if the node can provide text content
    function validTextNodeContent(node) {
        var _a;
        if (node.nodeType === 3) {
            return ((_a = node.nodeValue) === null || _a === void 0 ? void 0 : _a.trim()) || '';
        }
        return '';
    }
    function getXPathForElement(element) {
        if (element.nodeType !== 1) {
            return '';
        }
        const getIndex = (sib, name) => {
            let count = 1;
            for (let cur = sib.previousSibling; cur; cur = cur.previousSibling) {
                if (cur.nodeType === 1 && cur.nodeName === name) {
                    count++;
                }
            }
            return count;
        };
        const buildAttributePart = (elem) => {
            const attributes = ['id', 'resource-id', 'content-desc', 'class'];
            for (const attr of attributes) {
                if (elem.hasAttribute(attr)) {
                    const value = elem.getAttribute(attr);
                    if (value && value.trim() !== '') {
                        return `[@${attr}="${value}"]`;
                    }
                }
            }
            return '';
        };
        const getPath = (node, path = '') => {
            if (node.parentNode) {
                path = getPath(node.parentNode, path);
            }
            if (node.nodeType === 1) {
                const elem = node;
                const tagName = elem.nodeName.toLowerCase();
                let part = `/${tagName}`;
                const attributePart = buildAttributePart(elem);
                // 如果找到有意义的属性，则添加属性部分
                if (attributePart) {
                    part += attributePart;
                }
                else {
                    // 如果没有有意义的属性，则添加索引
                    const index = getIndex(node, node.nodeName);
                    if (index > 1) {
                        part += `[${index}]`;
                    }
                }
                path += part;
            }
            return path;
        };
        return getPath(element);
    }
    // Perform DFS traversal and collect element information
    function extractTextWithPosition(initNode) {
        const elementInfoArray = [];
        let nodeIndex = 1;
        function dfs(node, parentNode = null) {
            if (!node) {
                return;
            }
            const currentNodeDes = { node, children: [] };
            if (parentNode) {
                parentNode.children.push(currentNodeDes);
            }
            collectElementInfo(node);
            if (node.childNodes && node.childNodes.length > 0) {
                for (let i = 0; i < node.childNodes.length; i++) {
                    dfs(node.childNodes[i], currentNodeDes);
                }
            }
        }
        function collectElementInfo(node) {
            const attributes = getNodeAttributes(node);
            const rect = getRect(attributes);
            const nodeHashId = midsceneGenerateHash(null, attributes.placeholder, rect);
            const text = validTextNodeContent(node);
            let nodeType;
            switch (node.nodeName.toUpperCase()) {
                case 'TEXT':
                    nodeType = NodeType.TEXT;
                    break;
                case 'IMAGE':
                    nodeType = NodeType.IMG;
                    break;
                case 'BUTTON':
                    nodeType = NodeType.BUTTON;
                    break;
                case 'SEARCHINPUT':
                case 'TEXTINPUT':
                case 'INPUT':
                    nodeType = NodeType.FORM_ITEM;
                    break;
                case 'NAV':
                case 'LIST':
                case 'CELL':
                    nodeType = NodeType.CONTAINER;
                    break;
                default:
                    if (attributes.id === 'android:id/input' ||
                        attributes.id === 'android:id/inputArea') {
                        nodeType = NodeType.FORM_ITEM;
                    }
                    else {
                        nodeType = NodeType.CONTAINER;
                    }
                    break;
            }
            const xpath = getXPathForElement(node);
            const elementInfo = {
                id: nodeHashId,
                indexId: nodeIndex++,
                nodeHashId,
                locator: xpath,
                attributes: {
                    nodeType,
                    ...attributes,
                },
                content: text,
                rect,
                center: [
                    Math.round(rect.left + rect.width / 2),
                    Math.round(rect.top + rect.height / 2),
                ],
                nodeType,
            };
            if (elementInfo.nodeType !== NodeType.CONTAINER) {
                elementInfoArray.push(elementInfo);
            }
        }
        const rootNode = initNode;
        const rootDescriptor = { children: [] };
        dfs(rootNode, rootDescriptor);
        return elementInfoArray;
    }

    exports.clientExtractTextWithPosition = extractTextWithPosition;
    exports.descriptionOfTree = descriptionOfTree;
    exports.traverseTree = traverseTree;
    exports.treeToList = treeToList;
    exports.webExtractNodeTree = extractTreeNode;
    exports.webExtractNodeTreeAsString = extractTreeNodeAsString;
    exports.webExtractTextWithPosition = extractTextWithPosition$1;

}));
