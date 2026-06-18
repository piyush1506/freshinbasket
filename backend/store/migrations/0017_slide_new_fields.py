from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0016_product_tax_percentage'),
    ]

    operations = [
        migrations.AddField(
            model_name='slide',
            name='tag',
            field=models.CharField(blank=True, default='Organic', max_length=100),
        ),
        migrations.AddField(
            model_name='slide',
            name='button_text',
            field=models.CharField(blank=True, default='Shop Now', max_length=100),
        ),
        migrations.AddField(
            model_name='slide',
            name='link_two',
            field=models.CharField(blank=True, help_text='Second button link (View Offers)', max_length=500),
        ),
        migrations.AddField(
            model_name='slide',
            name='button_text_two',
            field=models.CharField(blank=True, default='View Offers', max_length=100),
        ),
    ]
