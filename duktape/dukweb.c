/*
 *  C entrypoints for dukweb.js
 *
 *  https://github.com/kripken/emscripten/wiki/Interacting-with-code
 */

#include <time.h>
#include <stdio.h>
#include <string.h>
#include <emscripten.h>

#define DUK_USE_INTERRUPT_COUNTER true
#define DUK_EXEC_INTERRUPT lowmem_exec_timeout_check
#define  AJSHEAP_EXEC_TIMEOUT  9  /* seconds */


static time_t curr_pcall_start = 0;
static long exec_timeout_check_counter = 0;

void lowmem_start_exec_timeout(void) {
	curr_pcall_start = time(NULL);
}

void lowmem_clear_exec_timeout(void) {
	curr_pcall_start = 0;
}

int lowmem_exec_timeout_check(void *udata) {
	time_t now = time(NULL);
	time_t diff = now - curr_pcall_start;

	exec_timeout_check_counter++;

	if (curr_pcall_start == 0) {
		/* protected call not yet running */
		return 0;
	}
	if (diff > AJSHEAP_EXEC_TIMEOUT) {
		return 1;
	}
	return 0;
}

#include "duktape.c"
static duk_context *dukweb_ctx = NULL;
char duk__evalbuf[10 * 1024 * 1024]; // 10 MB eval heap

extern "C" {

	EMSCRIPTEN_KEEPALIVE
	static int dukweb__emscripten_run_script(duk_context *ctx) {
		const char *code = duk_get_string(ctx, -1);
		if (!code) {
			return DUK_RET_TYPE_ERROR;
		}
		/* FIXME: return value */
		emscripten_run_script(code);
		return 0;
	}

	/* XXX: extract shared helper for string compatible escaping */
	EMSCRIPTEN_KEEPALIVE
	static void dukweb_fatal_helper(const char *msg, const char *prefix) {
		char buf[4096];
		char *p;
		const char *q;

		memset((void *) buf, 0, sizeof(buf));
		p = buf;
		p += sprintf(p, "%s('Duktape fatal error: ", prefix);

		for (q = msg; *q; q++) {
			size_t space = sizeof(buf) - (size_t) (q - buf);
			unsigned char ch;

			if (space < 8) {
				break;
			}
			ch = (unsigned char) *q;
			if (ch < 0x20 || ch >= 0x7e || ch == (unsigned char) '\'' || ch == (unsigned char) '"') {
				/* Escape to remain compatible with a string literal.
				* No UTF-8 handling now; shouldn't be needed as fatal
				* error messages are typically ASCII.
				*/
				p += sprintf(p, "\\u%04x", (unsigned int) ch);
			} else {
				*p++ = (char) ch;
			}
		}
		p += sprintf(p, "');");
		*p++ = (char) 0;

		emscripten_run_script((const char *) buf);
	}

	EMSCRIPTEN_KEEPALIVE
	void dukweb_fatal_handler(void *udata, const char *msg) {
		(void) udata;

		if (!msg) {
			msg = "no message";
		}
		dukweb_fatal_helper(msg, "alert");
		dukweb_fatal_helper(msg, "throw new Error");
		abort();
	}

	EMSCRIPTEN_KEEPALIVE
	int dukweb_is_open(void) {
		if (dukweb_ctx) {
			return 1;
		}
		return 0;
	}

	EMSCRIPTEN_KEEPALIVE
	void dukweb_open() {
		if (dukweb_ctx) {
			// printf("dukweb_open: heap already exists, destroying previous heap first\n");
			duk_destroy_heap(dukweb_ctx);
			dukweb_ctx = NULL;
		}
		// printf("dukweb_open: creating heap\n");
		dukweb_ctx = duk_create_heap(NULL, NULL, NULL, NULL, dukweb_fatal_handler);

		/* add a binding to emscripten_run_script(), let init code move it
		* to a better place
		*/
		duk_push_global_object(dukweb_ctx);
		duk_push_string(dukweb_ctx, "emscripten_run_script");
		duk_push_c_function(dukweb_ctx, dukweb__emscripten_run_script, 1 /*nargs*/);
		duk_put_prop(dukweb_ctx, -3);
		duk_set_top(dukweb_ctx, 0);
	}

	EMSCRIPTEN_KEEPALIVE
	void dukweb_close(void) {
		if (dukweb_ctx) {
			printf("dukweb_close: destroying heap\n");
			duk_destroy_heap(dukweb_ctx);
			dukweb_ctx = NULL;
		} else {
			printf("dukweb_close: heap doesn't exist, no-op\n");
		}
	}

	/* A very limited eval facility: one string input (eval code), one string
	* output (eval result or error, coerced with ToString()).  Data marshalling
	* needs to be implemented on top of this.
	*
	* FIXME: proper return value model which identifies errors from success values
	*/
	EMSCRIPTEN_KEEPALIVE
	const char *dukweb_eval(const char *code) {
		const char *res;
		duk_context *ctx = dukweb_ctx;

		if (!code) {
			sprintf(duk__evalbuf, "\"code argument is null\"");
			return (const char *) duk__evalbuf;
		}
		if (!ctx) {
			sprintf(duk__evalbuf, "\"heap does not exist\"");
			return (const char *) duk__evalbuf;
		}

		lowmem_start_exec_timeout();

		// printf("dukweb_eval: '%s'\n", code);
		duk_push_string(ctx, code);
		if (duk_peval(ctx) != 0) {
			/* failure */
			res = duk_safe_to_string(ctx, -1);
			// printf("dukweb_eval: result is error: %s\n", res ? res : "(null)");
		} else {
			/* success */
			res = duk_safe_to_string(ctx, -1);
			// printf("dukweb_eval: result is success: %s\n", res ? res : "(null)");
		}

		if (res) {
			size_t len = strlen(res);
			if (len > sizeof(duk__evalbuf) - 1) {
				sprintf(duk__evalbuf, "\"eval result too long\"");
			} else {
				memmove(duk__evalbuf, (const void *) res, len + 1);  /* include NUL */
			}
		} else {
			sprintf(duk__evalbuf, "\"eval result null\"");
		}

		lowmem_clear_exec_timeout();

		duk_set_top(ctx, 0);
	#if 0
		/* Test fatal error handling and its escaping */
		duk_fatal(ctx, "aiee! {} ' + ' \" \n \xc0");
	#endif
		return (const char *) duk__evalbuf;
	}
}