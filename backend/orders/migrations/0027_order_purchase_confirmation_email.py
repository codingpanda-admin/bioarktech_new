from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0026_delete_inprogressorderitem_crisprinprogressorderitem_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='purchase_email_attempted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='purchase_email_sent_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='purchase_email_status',
            field=models.CharField(
                choices=[
                    ('legacy', 'Legacy order'),
                    ('pending', 'Pending'),
                    ('sending', 'Sending'),
                    ('sent', 'Sent'),
                    ('failed', 'Failed'),
                ],
                default='legacy',
                max_length=16,
            ),
        ),
        migrations.AlterField(
            model_name='order',
            name='purchase_email_status',
            field=models.CharField(
                choices=[
                    ('legacy', 'Legacy order'),
                    ('pending', 'Pending'),
                    ('sending', 'Sending'),
                    ('sent', 'Sent'),
                    ('failed', 'Failed'),
                ],
                default='pending',
                max_length=16,
            ),
        ),
    ]
