import re

with open('public/index.html', 'r') as f:
    content = f.read()

nlp_section = """
    <!-- NLP Business Translation Section -->
    <section class="py-24 bg-white border-b border-slate-200 overflow-hidden relative">
        <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
        <div class="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <div class="flex flex-col lg:flex-row items-center gap-16">
                
                <div class="lg:w-1/2">
                    <h2 class="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">
                        <span data-lang="en">Natural Language Interface</span>
                        <span data-lang="es">Interfaz en Lenguaje Natural</span>
                    </h2>
                    <h3 class="text-3xl lg:text-5xl font-display font-bold text-beziro-900 mb-6 leading-tight">
                        <span data-lang="en">The Network Now Speaks Business.</span>
                        <span data-lang="es">La Infraestructura Ahora Habla tu Idioma.</span>
                    </h3>
                    <p class="text-slate-600 text-lg leading-relaxed mb-8">
                        <span data-lang="en">The true value of an OS is eliminating the technical barrier. With Beziro, business owners don't need to understand VLANs, Spanning Tree, or DSCP tags. Just tell the network what the business needs: <strong>"I want the POS systems to work perfectly and never fail."</strong> Our LLM Engine instantly translates your human intent into complex L2 isolation and QoS policies, executed natively via API.</span>
                        <span data-lang="es">El verdadero valor de un Sistema Operativo es eliminar la barrera técnica. Con Beziro, el responsable de negocio no necesita saber de VLANs, Spanning Tree o QoS. Solo pídele a la red lo que el negocio necesita: <strong>"Quiero que los TPVs de cobro funcionen perfectos y no se caigan."</strong> Nuestro motor LLM traducirá instantáneamente tu intención humana en políticas complejas ejecutadas vía API.</span>
                    </p>
                    <div class="inline-flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-full py-2 px-4">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span class="text-sm font-bold text-blue-900"><span data-lang="en">Business-to-Machine Translation</span><span data-lang="es">Traducción Business-to-Machine Activa</span></span>
                    </div>
                </div>

                <div class="lg:w-1/2 w-full">
                    <div class="bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-800 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
                        <!-- Chat Bubble 1 -->
                        <div class="flex gap-4 mb-8">
                            <div class="w-12 h-12 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white shadow-inner">CEO</div>
                            <div class="bg-slate-800 rounded-2xl rounded-tl-none p-5 text-base text-slate-200 shadow-sm border border-slate-700/50">
                                <span data-lang="en">"Make sure our VIP guests don't experience any buffering while watching Netflix in their suites tonight."</span>
                                <span data-lang="es">"Haz que los huéspedes VIP no tengan cortes viendo Netflix en su suite esta noche."</span>
                            </div>
                        </div>
                        <!-- Chat Bubble 2 (Beziro) -->
                        <div class="flex gap-4">
                            <div class="w-12 h-12 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-blue-500/30">Bz</div>
                            <div class="bg-blue-950/40 rounded-2xl rounded-tl-none p-5 text-sm font-mono text-emerald-400 shadow-sm border border-blue-500/30 w-full">
                                <div class="mb-3 text-blue-300">
                                    <span data-lang="en">// Executing business intent</span>
                                    <span data-lang="es">// Ejecutando intención de negocio</span>
                                </div>
                                <div class="space-y-2 opacity-90">
                                    <div><span data-lang="en">&gt; Identifying MACs associated with VIP profiles...</span><span data-lang="es">&gt; Identificando MACs asociadas a perfiles VIP...</span></div>
                                    <div><span data-lang="en">&gt; Generating Layer 7 QoS policy (Video)...</span><span data-lang="es">&gt; Generando política QoS Layer 7 (Video)...</span></div>
                                    <div>&gt; Applying PUT /clients/policy...</div>
                                </div>
                                <div class="mt-5 text-white font-bold bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-lg flex items-center gap-3">
                                    <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                                    <span data-lang="en">4K Streaming Guaranteed.</span>
                                    <span data-lang="es">Streaming 4K Garantizado.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>
"""

# Insert right after the Manifesto section
manifesto_end = "</section>"
manifesto_marker = '<!-- Platform Architecture Deep Dive -->'

idx = content.find(manifesto_marker)
if idx != -1:
    new_content = content[:idx] + nlp_section + "\n    " + content[idx:]
    with open('public/index.html', 'w') as f:
        f.write(new_content)
    print("Injected NLP section successfully")
else:
    print("Could not find marker")

