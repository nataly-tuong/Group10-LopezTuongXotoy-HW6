var WebGLUtils = function()
{
    function setupWebGL(canvas, opt_attribs, opt_onError)
    {
        var names = ["webgl2"];

        var context = create3DContext(
            canvas,
            opt_attribs,
            names
        );

        if (!context)
        {
            if (opt_onError)
            {
                opt_onError();
            }
            else
            {
                alert(
                    "WebGL 2.0 is not available."
                );
            }
        }

        return context;
    }


    function create3DContext(
        canvas,
        opt_attribs,
        opt_context_names
    )
    {
        var context = null;

        for (var ii = 0;
             ii < opt_context_names.length;
             ++ii)
        {
            try
            {
                context = canvas.getContext(
                    opt_context_names[ii],
                    opt_attribs
                );
            }
            catch (e)
            {
            }

            if (context)
            {
                break;
            }
        }

        return context;
    }


    return {
        setupWebGL: setupWebGL
    };
}();
