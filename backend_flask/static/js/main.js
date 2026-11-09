// Scripts interactifs client pour BiblioGest

document.addEventListener('DOMContentLoaded', function () {
    // Disparition automatique des alertes flash après 5 secondes
    const alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(function (alert) {
        setTimeout(function () {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
            bsAlert.close();
        }, 5000);
    });

    // Confirmation avant annulation
    const cancelForms = document.querySelectorAll('form[action*="annuler"]');
    cancelForms.forEach(function (form) {
        form.addEventListener('submit', function (e) {
            if (!confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) {
                e.preventDefault();
            }
        });
    });
});
