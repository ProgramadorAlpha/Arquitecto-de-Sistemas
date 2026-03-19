---
description: Flujo de validación para las actualizaciones de Círculo Íntimo (Edición de reglas y Estrategia IA)
---

Sigue estos pasos para validar que el sistema de Tribe/Red está operando bajo la nueva arquitectura:

1. **Acceso al Tab de Red**:
   - Navega a la pestaña 'Tribu & Apoyo' o 'Mi Red'.
   
2. **Prueba de Edición de Regla**:
   - Localiza el banner del Círculo Íntimo.
   - Haz clic directamente sobre el texto que dice "Regla de Hoy: ...".
   - El texto debería transformarse en un campo de entrada (input).
   - Escribe una regla personalizada (ej: "Foco total en la familia").
   - Presiona `Enter` o haz clic fuera del campo.
   - **Validación**: El texto debe actualizarse visualmente y mostrar la nueva regla con el ícono de edición.

3. **Prueba de Estrategia de Expansión con IA**:
   - Baja hasta la sección "Buscando la Tribu (Expansión)".
   - Haz clic en el ícono de la bombilla amarilla o en el botón "Regenerar con IA".
   - Observa que aparece un loader (círculo girando).
   - Espera la respuesta de la IA.
   - **Validación**: El texto debe aparecer SIN el prefijo "IA:". Debe ser una frase directa y accionable.

4. **Prueba de Persistencia**:
   - Refresca la página completamente (F5 o Ctrl+R).
   - Vuelve a la pestaña de Red.
   - **Validación**: Tanto la regla personalizada que escribiste como la estrategia generada por la IA deben seguir ahí. No deben haber vuelto a los valores por defecto.

5. **Validación Visual Mobile**:
   - Abre las herramientas de desarrollador (F12) y pon vista de móvil.
   - Verifica que el botón de "Regenerar con IA" no se encime con el título de la sección.
