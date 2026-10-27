ALTER TABLE patient_visits
MODIFY destination_type
ENUM('WARD', 'CLINIC', 'HOME')
NULL;