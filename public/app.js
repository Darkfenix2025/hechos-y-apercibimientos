document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos Generales (simplificado) ---
    const btnAnalizarHechos = document.getElementById('btnAnalizarHechos');
    const btnGenerarApercibimiento = document.getElementById('btnGenerarApercibimiento');
    const seccionAnalizarHechos = document.getElementById('seccionAnalizarHechos');
    const seccionGenerarApercibimiento = document.getElementById('seccionGenerarApercibimiento');

    // --- Elementos (Analizar Hechos) ---
    const textoHechosInput = document.getElementById('textoHechos');
    const resultadoHechosDiv = document.getElementById('resultadoHechos');
    const procesarHechosBtn = document.getElementById('procesarHechos');
    const indicadorCargaHechos = document.getElementById('indicadorCargaHechos');
    const guardarHechosBtn = document.getElementById('guardarHechos'); // Botón de guardar

    // --- Elementos (Generar Apercibimiento) ---
    const hechosApercibimientoInput = document.getElementById('hechosApercibimiento');
    const sancionesPreviasDiv = document.getElementById('sancionesPrevias');
    const resultadoApercibimientoDiv = document.getElementById('resultadoApercibimiento');
    const procesarApercibimientoBtn = document.getElementById('procesarApercibimiento');
    const agregarSancionBtn = document.getElementById('agregarSancion');
    const indicadorCargaApercibimiento = document.getElementById('indicadorCargaApercibimiento');
    const guardarApercibimientoBtn = document.getElementById('guardarApercibimiento'); // Botón de guardar

    let contadorSanciones = 0;

    // --- Funciones de Utilidad ---

    // function descargarArchivo(contenido, nombreArchivo, tipoMime) { //YA NO SE USA
    //     const blob = new Blob([contenido], { type: tipoMime });
    //     const url = URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = nombreArchivo;
    //     document.body.appendChild(a);
    //     a.click();
    //     document.body.removeChild(a);
    //     URL.revokeObjectURL(url);
    // }

    function mostrarSeccion(seccionId) {
        // Oculta todas las secciones principales
        document.querySelectorAll('.seccion-principal').forEach(seccion => {
            seccion.style.display = 'none';
        });

        // Muestra la sección seleccionada
        document.getElementById(seccionId).style.display = 'block';
    }
      function mostrarIndicadorCarga(seccion) {
      if (seccion == "Hechos") {
        indicadorCargaHechos.style.display = 'block'; // Muestra el indicador
        // Deshabilita los botones
        procesarHechosBtn.disabled = true;
        procesarApercibimientoBtn.disabled = true;
      }else{
        indicadorCargaApercibimiento.style.display = 'block';
        // Deshabilita los botones
        procesarHechosBtn.disabled = true;
        procesarApercibimientoBtn.disabled = true;
      }

    }

    function ocultarIndicadorCarga(seccion) {
      if(seccion == "Hechos"){
        indicadorCargaHechos.style.display = 'none'; // Oculta el indicador
        // Habilita los botones
        procesarHechosBtn.disabled = false;
        procesarApercibimientoBtn.disabled = false;
      }else{
        indicadorCargaApercibimiento.style.display = 'none';
        //Habilita los botones
        procesarHechosBtn.disabled = false;
        procesarApercibimientoBtn.disabled = false;
      }
    }

    // --- Event Listeners para los Botones Principales ---

    btnAnalizarHechos.addEventListener('click', () => {
        mostrarSeccion('seccionAnalizarHechos');
    });

    btnGenerarApercibimiento.addEventListener('click', () => {
        mostrarSeccion('seccionGenerarApercibimiento');
    });

    // --- Función para enviar solicitudes al servidor (REFACTORIZADA) ---
    async function enviarSolicitud(ruta, texto, archivo) {
        const formData = new FormData();
        const data = {};

        if (texto) {
            formData.append('texto', texto);
            data.texto = texto;
        } else if (archivo) {
            formData.append('archivo', archivo);
        } else {
            throw new Error('Se debe proporcionar texto o archivo.'); // Mejor manejo de errores
        }

        const response = await fetch(ruta, {
            method: 'POST',
            body: texto ? JSON.stringify(data) : formData,
            headers: texto ? { 'Content-Type': 'application/json' } : {},
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al procesar la solicitud');
        }

        return await response.json();
    }

   // --- Event Listeners para los Botones de Procesamiento ---
    procesarHechosBtn.addEventListener('click', async () => {
      const seccion = "Hechos"
      mostrarIndicadorCarga(seccion);
        try {
            const texto = textoHechosInput.value;
            const dataRespuesta = await enviarSolicitud('/analizar_hechos', texto);
            resultadoHechosDiv.textContent = dataRespuesta.resultado;
        } catch (error) {
            console.error('Error:', error);
            resultadoHechosDiv.textContent = `Error: ${error.message}`;
        }finally{
          ocultarIndicadorCarga(seccion);
        }
    });

    procesarApercibimientoBtn.addEventListener('click', async () => {
      const seccion = "Apercibimiento"
      mostrarIndicadorCarga(seccion);
        const hechos = hechosApercibimientoInput.value;
        if (!hechos) {
            alert('Por favor, ingrese los hechos.');
            ocultarIndicadorCarga(seccion);
            return;
        }

        const sanciones = [];
        sancionesPreviasDiv.querySelectorAll('div').forEach(div => {
            const fecha = div.querySelector('.fecha-sancion').value;
            const tipo = div.querySelector('.tipo-sancion').value;
            const motivo = div.querySelector('.motivo-sancion').value;
            if (fecha && tipo && motivo) {
                sanciones.push({ fecha, tipo, motivo });
            }
        });

        try {
            const response = await fetch('/generar_apercibimiento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hechos, sanciones }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al generar el apercibimiento.');
            }

            const data = await response.json();
            resultadoApercibimientoDiv.textContent = data.resultado;
        } catch (error) {
            console.error('Error:', error);
            resultadoApercibimientoDiv.textContent = `Error: ${error.message}`;
        }finally{
          ocultarIndicadorCarga(seccion);
        }
    });

    // --- Agregar sanción (dinámicamente) ---
    agregarSancionBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.innerHTML = `
            <label>Fecha:</label>
            <input type="date" class="fecha-sancion">
            <label>Tipo:</label>
            <select class="tipo-sancion">
                <option value="apercibimiento">Apercibimiento</option>
                <option value="suspension">Suspensión</option>
            </select>
            <label>Motivo:</label>
            <input type="text" class="motivo-sancion">
            <button class="eliminar-sancion">Eliminar</button>
        `;

        // Event listener para el botón eliminar
        div.querySelector('.eliminar-sancion').addEventListener('click', () => {
            div.remove();
        });

        sancionesPreviasDiv.appendChild(div);
    });

    // --- Funciones de descarga (MODIFICADAS) ---

    async function descargarArchivo(texto, sugerenciaNombre, tipo) {
        if (!texto) {
            alert('No hay contenido para guardar.');
            return;
        }

        try {
            let fileHandle;
            if(tipo === 'txt'){
                fileHandle = await window.showSaveFilePicker({
                suggestedName: sugerenciaNombre,
                types: [{
                    description: 'Text Files',
                    accept: { 'text/plain': ['.txt'] },
                }],
            });
            const writable = await fileHandle.createWritable();
            await writable.write(texto);
            await writable.close();
            } else if (tipo === 'docx'){
                const doc = new window.docx.Document({
                sections: [{
                    properties: {},
                    children: [
                        new window.docx.Paragraph({
                            children: [
                                new window.docx.TextRun(texto),
                            ],
                        }),
                    ],
                }],
            });
                const blob = await window.docx.Packer.toBlob(doc);
                fileHandle = await window.showSaveFilePicker({
                    suggestedName: sugerenciaNombre,
                    types: [{
                        description: 'Word Document',
                        accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
                    }],
                });
                const writable = await fileHandle.createWritable();
                await writable.write(blob); // Escribir el Blob
                await writable.close();
            }else if (tipo === 'pdf'){
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const lineas = doc.splitTextToSize(texto, 180);
                doc.text(lineas, 10, 10);
                fileHandle = await window.showSaveFilePicker({
                    suggestedName: sugerenciaNombre,
                    types: [{
                        description: 'PDF Document',
                        accept: { 'application/pdf': ['.pdf'] },
                    }],
                });

                const pdfBlob = await doc.output('blob'); // Generar un Blob desde el PDF
                const writable = await fileHandle.createWritable();
                await writable.write(pdfBlob);  //Escribir el blob
                await writable.close();

            }

        } catch (error) {
            console.error('Error al guardar el archivo:', error);
            alert('Error al guardar el archivo: ' + error.message);
        }
    }


    // --- Event Listeners para los Botones de Guardar ---

    guardarHechosBtn.addEventListener('click', async () => {
        const extension = prompt("Ingrese la extensión deseada (.txt, .docx, .pdf):", ".txt");
        if (extension) {
          descargarArchivo(resultadoHechosDiv.textContent, 'hechos_reformulados' + extension, extension.replace('.', ''));
        }
    });

    guardarApercibimientoBtn.addEventListener('click', async () => {
        const extension = prompt("Ingrese la extensión deseada (.txt, .docx, .pdf):", ".txt");
        if (extension) {
            descargarArchivo(resultadoApercibimientoDiv.textContent, 'apercibimiento' + extension, extension.replace('.', ''));
        }
    });
});