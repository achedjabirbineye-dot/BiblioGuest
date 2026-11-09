"""
Service de génération de QR code
Conforme aux Sections 2 et 4 :
Encode le numéro de carte unique de l'adhérent (ex: ETU-2025-0001).
"""

import io
import base64
import qrcode

def generer_qr_code_base64(numero_carte: str) -> str:
    """
    Génère une image PNG en base64 du QR Code contenant la valeur du numéro de carte.
    Permet l'affichage direct dans les templates HTML (balise <img>).
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(numero_carte.strip().upper())
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{image_base64}"
