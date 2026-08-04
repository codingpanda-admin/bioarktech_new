from django.db import models

# Create your models here.
class GeneLibrary(models.Model):
    gene_library_id = models.AutoField(primary_key=True)
    target_sequence = models.CharField(max_length=6)
    gene_name = models.CharField()
    abbreviation = models.CharField(blank=True, null=True)
    symbol = models.CharField()
    locus_id = models.IntegerField(null=True)
    species = models.CharField(null=True)
    description = models.CharField(blank=True, null=True)
    reference_link = models.CharField(null=True)

    class Meta:
        db_table = 'gene_library'